import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Phone,
  Mail,
  MapPin,
  ChevronUp,
  CreditCard,
  Lock,
  Award,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings } = useCart();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-800 bg-[#131921] text-slate-300">
      
      {/* Back to top bar */}
      <button
        onClick={scrollToTop}
        className="flex w-full items-center justify-center gap-1.5 bg-[#232f3e] py-3.5 text-xs font-bold text-white hover:bg-[#37475a] transition"
      >
        <ChevronUp className="h-4 w-4" />
        <span>Back to top</span>
      </button>

      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-800/80 bg-[#0f141d] py-6">
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">100% Genuine Products</h4>
              <p className="text-[11px] text-slate-400">Direct from authorized brands</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">7 Days Easy Return</h4>
              <p className="text-[11px] text-slate-400">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Fast Assured Delivery</h4>
              <p className="text-[11px] text-slate-400">Free delivery on orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Wholesale Tier Pricing</h4>
              <p className="text-[11px] text-slate-400">Instant price drops on bulk quantities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Columns */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: About */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">About</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition">Careers</Link></li>
              <li><Link to="/press" className="hover:text-white transition">Press Releases</Link></li>
              <li><Link to="/wholesale" className="hover:text-amber-400 transition font-semibold text-amber-400">Wholesale & B2B Slabs</Link></li>
              <li><Link to="/corporate" className="hover:text-white transition">Corporate Information</Link></li>
            </ul>
          </div>

          {/* Col 2: Help */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/account" className="hover:text-white transition">Your Account</Link></li>
              <li><Link to="/account" className="hover:text-white transition">Returns Centre</Link></li>
              <li><Link to="/help/shipping" className="hover:text-white transition">100% Purchase Protection</Link></li>
              <li><Link to="/help/shipping" className="hover:text-white transition">Shipping Rates & Policies</Link></li>
              <li><a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold hover:underline">WhatsApp Live Chat</a></li>
            </ul>
          </div>

          {/* Col 3: Consumer Policy */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Consumer Policy</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/terms" className="hover:text-white transition">Cancellation & Returns</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms of Use</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Security & Privacy</Link></li>
              <li><Link to="/sitemap" className="hover:text-white transition">Sitemap</Link></li>
              <li><Link to="/grievance" className="hover:text-white transition">EPR Compliance</Link></li>
            </ul>
          </div>

          {/* Col 4: Mail Us */}
          <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Mail Us:</h4>
            <div className="text-xs text-slate-400 leading-relaxed space-y-1">
              <p className="font-semibold text-slate-200">{settings.storeName} Internet Private Limited,</p>
              <p>Buildings Alyssa, Begonia & Clove Embassy Tech Village,</p>
              <p>Outer Ring Road, Devarabeesanahalli Village,</p>
              <p>Bengaluru, 560103, Karnataka, India</p>
              <p className="pt-2 text-slate-300">CIN: U51109KA2012PTC066107</p>
              <p>Phone: <span className="text-white font-medium">{settings.storePhone}</span></p>
            </div>
          </div>

          {/* Col 5: Registered Office */}
          <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Registered Office:</h4>
            <div className="text-xs text-slate-400 leading-relaxed space-y-1">
              <p className="font-semibold text-slate-200">{settings.storeName} Commerce Hub,</p>
              <p>42 Industrial Area, Phase II,</p>
              <p>Bengaluru, 560068, Karnataka, India</p>
              <div className="pt-3">
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=Hi,%20I%20want%20to%20place%20a%20wholesale%20bulk%20order.`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Wholesale Enquiries</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar with Payment Gateways & Copyright */}
      <div className="border-t border-slate-800/80 bg-[#0d1117] py-6">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">100% Secure Payments:</span>
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-300">
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-purple-400">PhonePe</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-blue-400">UPI</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-emerald-400">Google Pay</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-cyan-400">Paytm</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-amber-400">RuPay</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-slate-300">Visa / MC</span>
              <span className="rounded bg-[#1a2232] px-2 py-1 border border-slate-700 text-orange-400">NetBanking</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted</span>
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
};
