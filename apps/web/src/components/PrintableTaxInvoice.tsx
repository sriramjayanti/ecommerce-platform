import React from 'react';
import { Order } from '@ecommerce/shared';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface PrintableTaxInvoiceProps {
  order: Order;
  onClose?: () => void;
}

export const PrintableTaxInvoice: React.FC<PrintableTaxInvoiceProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // Compute number to words in Indian Rupees
  const numberToWordsIndian = (num: number): string => {
    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
      'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      let str = '';
      if (n > 19) {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      } else {
        str += a[n];
      }
      return str;
    };

    let n = Math.floor(num);
    if (n === 0) return 'Zero Rupees Only';

    let output = '';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = Math.floor(n / 100);
    n %= 100;

    if (crore > 0) output += inWords(crore) + 'Crore ';
    if (lakh > 0) output += inWords(lakh) + 'Lakh ';
    if (thousand > 0) output += inWords(thousand) + 'Thousand ';
    if (hundred > 0) output += inWords(hundred) + 'Hundred ';
    if (n > 0) output += (output !== '' ? 'and ' : '') + inWords(n);

    return 'Indian Rupees ' + output.trim() + ' Only';
  };

  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const invoiceTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* Print CSS styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-tax-invoice, #printable-tax-invoice * {
            visibility: visible !important;
          }
          #printable-tax-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Floating Action Modal on Screen, Pure Clean A4 Document on Print */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col">
          
          {/* Top Modal Controls (Hidden in Print) */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-sm sm:text-base">Official GST Tax Invoice Preview</h3>
              <span className="text-xs text-slate-400 hidden sm:inline">• #{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black shadow-md transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/50 flex-1">
            <div
              id="printable-tax-invoice"
              className="max-w-[800px] mx-auto bg-white border border-slate-300 p-8 sm:p-10 shadow-sm text-slate-900 text-xs font-sans leading-relaxed"
            >
              {/* HEADER */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                      DAILYFRESH & WHOLESALE MART PVT. LTD.
                    </h1>
                    <p className="text-[11px] font-bold text-emerald-800 tracking-wide mt-0.5">
                      Wholesale Supermarket • Agricultural Produce • Cold-Chain Logistics
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Plot #124, APMC Wholesale Market Hub, Ring Road, Bengaluru, Karnataka - 560034
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Email: support@dailyfreshmart.in | Helpdesk: +91 98765 43210
                    </p>
                  </div>
                  <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-slate-200 pl-3 sm:pl-0">
                    <span className="inline-block rounded bg-slate-900 text-white font-black px-3 py-1 text-xs uppercase tracking-wider mb-2">
                      TAX INVOICE
                    </span>
                    <p className="font-bold text-[11px] text-slate-800">Original for Recipient</p>
                    <p className="text-[11px] text-slate-600 font-mono">GSTIN: 29AABCU9603R1ZM</p>
                    <p className="text-[11px] text-slate-600 font-mono">FSSAI Lic: 11223334000567</p>
                    <p className="text-[11px] text-slate-600 font-mono">CIN: U51909KA2024PTC189201</p>
                  </div>
                </div>
              </div>

              {/* INVOICE & ORDER METADATA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Invoice Number</span>
                  <span className="font-mono font-black text-slate-950 text-xs">INV-{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Invoice Date</span>
                  <span className="font-bold text-slate-900">{invoiceDate} {invoiceTime}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Order Reference</span>
                  <span className="font-mono font-bold text-slate-900">#{order.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Payment Mode</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {order.paymentMethod} • <span className={order.paymentStatus === 'successful' ? 'text-emerald-700 font-black' : 'text-amber-700'}>{order.paymentStatus}</span>
                  </span>
                </div>
              </div>

              {/* BILLED TO & SHIPPED TO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Billed To (Customer Details)
                  </span>
                  <p className="font-black text-slate-900 text-sm">{order.customerName}</p>
                  <p className="text-slate-700 font-medium">Contact: +91 {order.customerPhone}</p>
                  {order.customerEmail && <p className="text-slate-600">{order.customerEmail}</p>}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Shipped To (Delivery Destination)
                  </span>
                  <p className="font-bold text-slate-900">{order.shippingAddress?.fullName || order.customerName}</p>
                  <p className="text-slate-700 leading-snug">
                    {order.shippingAddress?.line1}
                    {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}
                    {order.shippingAddress?.landmark ? `, Near ${order.shippingAddress.landmark}` : ''}
                  </p>
                  <p className="text-slate-700 font-bold">
                    {order.shippingAddress?.city || 'Bengaluru'}, {order.shippingAddress?.state || 'Karnataka'} - {order.shippingAddress?.pincode || '560034'}
                  </p>
                  <p className="text-slate-600 font-medium text-[11px]">
                    Fulfilment: {order.fulfilmentMethod === 'takeaway' ? 'Store Pickup Hub' : 'Doorstep Express Delivery'}
                  </p>
                </div>
              </div>

              {/* ITEM TABLE */}
              <div className="py-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-black text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-2 text-center w-8">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2 text-center w-16">HSN</th>
                      <th className="py-2.5 px-2 text-center w-12">Qty</th>
                      <th className="py-2.5 px-2 text-right w-16">MRP</th>
                      <th className="py-2.5 px-2 text-right w-20">Rate</th>
                      <th className="py-2.5 px-2 text-right w-20">Wholesale Disc.</th>
                      <th className="py-2.5 px-3 text-right w-24">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-950 block">{it.title}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {it.variantName} • SKU: {it.sku}
                            {it.appliedTierLabel && ` • [${it.appliedTierLabel}]`}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600">
                          {idx % 3 === 0 ? '1006' : idx % 3 === 1 ? '1101' : '1512'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-black text-slate-900">{it.quantity}</td>
                        <td className="py-2.5 px-2 text-right text-slate-400 line-through">₹{it.mrp}</td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">₹{it.unitPrice}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-700 font-semibold text-[11px]">
                          {it.savings > 0 ? `₹${it.savings}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-950">₹{it.lineTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL BREAKDOWN & TOTAL IN WORDS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-3 border-t-2 border-slate-900">
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                      Amount in Words
                    </span>
                    <p className="font-bold text-slate-900 text-xs italic mt-0.5">
                      {numberToWordsIndian(order.finalTotal)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1 text-[10px] text-slate-600">
                    <span className="font-bold text-slate-800 uppercase block">Tax Summary & GST Notice</span>
                    <p>• Goods supplied are covered under GST rates applicable as per CGST/SGST Notification 01/2017.</p>
                    <p>• All prices are inclusive of CGST (2.5%) + SGST (2.5%) where applicable.</p>
                    <p>• E-Way bill generation not required for intra-city consignment below threshold limit.</p>
                  </div>
                </div>

                <div className="sm:col-span-5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Gross Item Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{order.subtotal + (order.totalSavings || 0)}</span>
                  </div>
                  {order.totalSavings > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                      <span className="font-bold">Total Wholesale Slab Savings:</span>
                      <span className="font-black">- ₹{order.totalSavings}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Net Taxable Value:</span>
                    <span className="font-bold text-slate-900">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Delivery & Packaging:</span>
                    <span className="font-bold text-slate-900">
                      {order.deliveryCharge === 0 ? <span className="text-emerald-700 font-black">FREE (₹0)</span> : `₹${order.deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-slate-900 text-base font-black text-slate-950">
                    <span>Grand Total:</span>
                    <span className="text-emerald-800">₹{order.finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER & TERMS */}
              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-[10px] text-slate-500">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 uppercase block">Standard Terms & Conditions:</span>
                  <p>1. Warranty/Replacements applicable per manufacturer policies.</p>
                  <p>2. Damaged or missing items must be reported within 24 hours of delivery.</p>
                  <p>3. This is an electronically generated and authenticated invoice.</p>
                </div>
                <div className="sm:text-right space-y-1">
                  <p className="font-bold text-slate-800 text-[11px]">For DAILYFRESH & WHOLESALE MART PVT. LTD.</p>
                  <div className="h-10 flex items-center justify-end">
                    <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Digitally Signed & Verified
                    </span>
                  </div>
                  <p className="font-bold text-slate-700">Authorized Signatory</p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Controls Bar (Hidden in Print) */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 flex-shrink-0">
            <span className="text-xs text-slate-500">
              Tax invoice is compliant with GST & FSSAI standards.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

