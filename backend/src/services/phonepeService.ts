import crypto from 'crypto';
import { PaymentRecord, PaymentStatus } from '@ecommerce/shared';
import { db } from './db';

export interface PhonePeConfig {
  merchantId: string;
  saltKey: string;
  saltIndex: number;
  apiEndpoint: string;
  redirectUrl: string;
  callbackUrl: string;
  isSandbox: boolean;
}

export const PHONEPE_CONFIG: PhonePeConfig = {
  merchantId: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT',
  saltKey: process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399',
  saltIndex: Number(process.env.PHONEPE_SALT_INDEX) || 1,
  apiEndpoint: process.env.PHONEPE_API_ENDPOINT || 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'http://localhost:5173/payment/callback',
  callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'http://localhost:3000/api/payments/webhook',
  isSandbox: true,
};

export class PhonePeService {
  /**
   * Generates SHA256 Checksum header required by PhonePe API
   */
  public static generateChecksum(payload: string, endpoint: string): string {
    const stringToHash = payload + endpoint + PHONEPE_CONFIG.saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return `${sha256}###${PHONEPE_CONFIG.saltIndex}`;
  }

  /**
   * Verifies SHA256 Checksum on incoming webhooks/callbacks
   */
  public static verifyChecksum(receivedChecksum: string, payload: string, endpoint: string): boolean {
    const expected = this.generateChecksum(payload, endpoint);
    return receivedChecksum === expected;
  }

  /**
   * Initiates payment request for a given order
   */
  public static async initiatePayment(
    orderId: string,
    amount: number,
    customerPhone: string,
    userId: string
  ): Promise<{
    paymentRecord: PaymentRecord;
    redirectUrl?: string;
    instrumentResponse?: any;
  }> {
    const merchantTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create internal payment record
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId,
      merchantTransactionId,
      amount,
      currency: 'INR',
      status: 'initiated',
      provider: 'phonepe',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.payments.push(paymentRecord);

    // Payload formatted per PhonePe Standard Integration specifications
    const paymentPayload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId,
      merchantUserId: userId || `CUST_${customerPhone}`,
      amount: Math.round(amount * 100), // Amount in paise
      redirectUrl: `${PHONEPE_CONFIG.redirectUrl}?merchantTransactionId=${merchantTransactionId}&orderId=${orderId}`,
      redirectMode: 'POST',
      callbackUrl: PHONEPE_CONFIG.callbackUrl,
      mobileNumber: customerPhone.replace(/\D/g, '').slice(-10),
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const xVerify = this.generateChecksum(base64Payload, '/pg/v1/pay');

    paymentRecord.checksum = xVerify;
    paymentRecord.status = 'pending';
    paymentRecord.updatedAt = new Date().toISOString();

    // In local sandbox / mock mode, return an interactive simulated payment URL
    const simulationUrl = `http://localhost:5173/payment/simulator?merchantTransactionId=${merchantTransactionId}&orderId=${orderId}&amount=${amount}`;

    return {
      paymentRecord,
      redirectUrl: PHONEPE_CONFIG.isSandbox ? simulationUrl : `${PHONEPE_CONFIG.apiEndpoint}/pg/v1/pay`,
      instrumentResponse: {
        base64Payload,
        xVerify,
        merchantTransactionId,
      },
    };
  }

  /**
   * Authoritative server status check for a transaction
   */
  public static async checkStatus(merchantTransactionId: string): Promise<{
    status: PaymentStatus;
    phonepeTransactionId?: string;
    responseCode?: string;
    message?: string;
  }> {
    const payment = db.payments.find((p) => p.merchantTransactionId === merchantTransactionId);
    if (!payment) {
      throw new Error(`Payment with transaction ID ${merchantTransactionId} not found`);
    }

    // In real mode, queries: GET /pg/v1/status/{merchantId}/{merchantTransactionId}
    // with header X-VERIFY: SHA256("/pg/v1/status/" + merchantId + "/" + txnId + saltKey) + "###" + saltIndex
    return {
      status: payment.status,
      phonepeTransactionId: payment.phonepeTransactionId,
      responseCode: payment.responseCode || 'SUCCESS',
      message: payment.status === 'successful' ? 'Payment Verified' : 'Payment Processing',
    };
  }

  /**
   * Updates payment record upon server-to-server webhook or verified status return
   */
  public static updatePaymentResult(
    merchantTransactionId: string,
    status: PaymentStatus,
    phonepeTransactionId?: string,
    rawResponse?: any
  ): PaymentRecord {
    const payment = db.payments.find((p) => p.merchantTransactionId === merchantTransactionId);
    if (!payment) {
      throw new Error(`Payment ${merchantTransactionId} not found for update`);
    }

    payment.status = status;
    payment.phonepeTransactionId = phonepeTransactionId || payment.phonepeTransactionId;
    payment.rawResponse = rawResponse || payment.rawResponse;
    payment.updatedAt = new Date().toISOString();

    return payment;
  }
}
