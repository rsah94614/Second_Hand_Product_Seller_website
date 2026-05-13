import React from 'react';
import { Users, Package, ShieldCheck } from 'lucide-react';

export const StatsBand = ({ liveListingCount, budgetPickCount, categoryCount }) => {
  return (
    <section className="px-4 pb-20 pt-4 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-4xl bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-primary-900 to-blue-950 opacity-95" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/15 via-transparent to-transparent blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { icon: Users, value: liveListingCount, label: 'Live Listings', color: 'text-cyan-300' },
              { icon: Package, value: budgetPickCount, label: 'Budget Picks Today', color: 'text-amber-300' },
              { icon: ShieldCheck, value: categoryCount, label: 'Categories', color: 'text-emerald-300' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center justify-center gap-3 py-12 px-8 text-center">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ${item.color}`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <p className={`text-5xl font-black tracking-tight ${item.color}`}>{item.value}</p>
                <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
