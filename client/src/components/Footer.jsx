import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Sparkles } from 'lucide-react';
import { DEFAULT_PRODUCT_CATEGORIES } from '../config/productOptions';

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary-600/15 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-indigo-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center mb-5 group">
              <div className="px-2.5 h-8 bg-linear-to-br from-primary-600 to-indigo-400 rounded-xl flex items-center justify-center text-white font-black text-lg tracking-tight shadow-md group-hover:rotate-2 transition-transform duration-300">
                Campus
              </div>
              <span className="text-2xl font-black text-white tracking-tight ml-0.5">Mitra</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              A student-built campus marketplace. Buy and sell second-hand items with ease — built for Guwahati University students.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/30 mt-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Built by students, for students.</span>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Marketplace</h4>
            <ul className="space-y-3">
              {[
                { to: '/products', label: 'Browse Products' },
                { to: '/create-product', label: 'List an Item' },
                { to: '/my-products', label: 'My Listings' },
                { to: '/dashboard', label: 'Seller Dashboard' },
                { to: '/profile', label: 'My Profile' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/55 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Categories</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
              {DEFAULT_PRODUCT_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    to={`/products?category=${encodeURIComponent(category)}`}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-sm text-white/55 mt-1">Gauhati University, Guwahati, Assam</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm text-white/55">
                  Contact via the platform chat
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-white/35">
            <Sparkles className="w-3.5 h-3.5" />
            <span>© {new Date().getFullYear()} CampusMitra. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <span className="text-white/20">Student Project — Gauhati University</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
