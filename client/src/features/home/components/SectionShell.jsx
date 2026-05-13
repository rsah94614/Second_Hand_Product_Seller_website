import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const SectionShell = ({ 
  title, 
  description, 
  icon: Icon, 
  accent = 'text-primary-600', 
  viewAllTo = '/products', 
  children 
}) => (
  <section className="px-4 py-8 md:py-14 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 md:mb-10 flex items-end justify-between gap-4">
        <div>
          <div className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${accent} bg-current/5`}
            style={{ backgroundColor: 'transparent' }}
          >
            {Icon && React.createElement(Icon, { className: `h-4 w-4 ${accent}` })}
            <span className={accent}>{title}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">{title}</h2>
          <p className="mt-2 max-w-xl text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
        <Link to={viewAllTo} className="hidden md:inline-flex shrink-0">
          <Button variant="outline" className="gap-2 rounded-full border-gray-200 px-5 hover:border-primary-300 hover:cursor-pointer">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {children}
      <div className="mt-14 h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  </section>
);
