import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Cpu, BookOpen, Shirt, Home, 
  Coffee, Bike, Camera, Music, Package 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const CATEGORY_META = {
  'Electronics': { icon: Cpu, color: 'from-blue-500 to-indigo-600', text: 'text-blue-600' },
  'Books & Study Materials': { icon: BookOpen, color: 'from-amber-400 to-orange-500', text: 'text-amber-600' },
  'Fashion & Clothing': { icon: Shirt, color: 'from-pink-500 to-rose-500', text: 'text-pink-600' },
  'Hostel Essentials': { icon: Home, color: 'from-orange-500 to-amber-600', text: 'text-orange-600' },
  'Furniture & Decor': { icon: Coffee, color: 'from-stone-500 to-amber-700', text: 'text-stone-600' },
  'Sports & Fitness': { icon: Bike, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600' },
  'Bags & Accessories': { icon: Camera, color: 'from-fuchsia-500 to-pink-600', text: 'text-fuchsia-600' },
  'Cycles': { icon: Bike, color: 'from-red-500 to-rose-600', text: 'text-red-600' },
  'Academic Tools': { icon: Music, color: 'from-violet-500 to-purple-600', text: 'text-violet-600' },
  'Other': { icon: Package, color: 'from-slate-500 to-gray-600', text: 'text-slate-600' },
};

const getCategoryMeta = (name) =>
  CATEGORY_META[name] || { icon: Package, color: 'from-gray-400 to-gray-500', text: 'text-gray-500' };

export const CategoryGrid = ({ categories, onCategoryClick }) => {
  return (
    <section className="px-4 py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Browse by Category</h2>
          </div>
          <Link to="/products" className="hidden md:block">
            <Button variant="outline" className="gap-2 rounded-full text-sm hover:cursor-pointer hover:border-primary-300 border-gray-200 px-5">
              All Products <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((category) => {
            const { icon: CatIcon, color, text } = getCategoryMeta(category);
            return (
              <button
                key={category}
                onClick={() => onCategoryClick(category)}
                className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-200 hover:cursor-pointer"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${color} shadow-md transition-transform group-hover:scale-110`}>
                  <CatIcon className="h-6 w-6 text-white" />
                </div>
                <span className="block font-black text-gray-900 tracking-tight text-sm transition-colors">
                  {category}
                </span>
                <span className={`mt-1 block text-xs font-medium ${text} opacity-70`}>
                  Browse listings <ArrowRight className="inline-block h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-12 h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </section>
  );
};
