import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const HeroSection = ({ user }) => {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-8 lg:px-12">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl bg-slate-900 shadow-[0_30px_90px_-15px_rgba(15,23,42,0.28)] relative">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-linear-to-br from-primary-950 via-indigo-900 to-blue-950 opacity-95" />
        {/* Ambient glow orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[180%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary-500/25 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[160%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA0Ii8+PC9zdmc+')] opacity-60" />

        <div className="relative z-10 grid gap-8 md:gap-10 px-5 py-10 sm:px-8 sm:py-14 md:px-14 lg:grid-cols-[1.3fr_0.7fr] lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              CampusMitra Marketplace
            </div>
            <h1 className="max-w-2xl text-3xl font-black leading-none tracking-[-0.04em] text-white sm:text-4xl md:text-[3.5rem] animate-fade-in">
              Buy useful campus essentials before they are gone.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65 md:text-lg">
              Browse category-first, check the newest listings, and grab affordable second-hand items from students around you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button variant="outline" className="h-12 px-7 rounded-full border-white/25 hover:text-primary-700 text-white bg-white/10 hover:cursor-pointer">
                  Browse All Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to={user ? '/create-product' : '/register'}>
                <Button variant="outline" className="h-12 px-7 rounded-full border-white/25 hover:text-primary-700 text-white bg-white/10 hover:cursor-pointer">
                  {user ? 'List an Item' : 'Start Selling'}
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm text-white/50">
              {['Fresh listings', 'Budget-friendly picks', 'Student-to-student deals'].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">{tag}</span>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-center gap-8">
            {[
              { icon: Zap, color: 'text-amber-300', label: 'Built for quick resale', sub: 'Fresh and affordable listings matter more here than popularity metrics.' },
              { icon: ShieldCheck, color: 'text-emerald-300', label: 'Simple campus flow', sub: 'Browse by category, open a listing, and contact the seller without extra clutter.' },
            ].map((item) => (
              <div key={item.label} className="flex gap-4">
                <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">{item.label}</h3>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
