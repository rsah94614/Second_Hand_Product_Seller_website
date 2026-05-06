import React from 'react';
import ProductCard from '../../../components/ProductCard.jsx';
import { Sparkles, Zap, Package } from 'lucide-react';
import { PageShell } from '../../../components/layout/PageShell.jsx';
import { useHomeLogic } from '../hooks/useHomeLogic.js';
import { HeroSection } from '../components/HeroSection.jsx';
import { CategoryGrid } from '../components/CategoryGrid.jsx';
import { SectionShell } from '../components/SectionShell.jsx';
import { StatsBand } from '../components/StatsBand.jsx';
import { SkeletonGrid } from '../components/SkeletonGrid.jsx';

const HomePage = () => {
  const {
    user,
    categories,
    latestProducts,
    latestLoading,
    budgetProducts,
    budgetLoading,
    recentlyViewed,
    liveListingCount,
    budgetPickCount,
    handleCategoryClick,
  } = useHomeLogic();

  const renderProductGrid = (products, isLoading, highlightLabel, highlightTone) =>
    isLoading ? (
      <SkeletonGrid />
    ) : (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
        {(products?.products || []).map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            highlightLabel={highlightLabel}
            highlightTone={highlightTone}
          />
        ))}
      </div>
    );

  return (
    <PageShell maxWidth="max-w-none" containerClassName="px-0 pb-0">
      <HeroSection user={user} />

      <CategoryGrid 
        categories={categories} 
        onCategoryClick={handleCategoryClick} 
      />

      <SectionShell
        title="Latest Products"
        description="Fresh listings from across the marketplace — spot newly available deals right away."
        icon={Sparkles}
        accent="text-primary-600"
      >
        {renderProductGrid(latestProducts, latestLoading, 'Fresh', 'bg-primary-600 text-white')}
      </SectionShell>

      <SectionShell
        title="Budget Picks"
        description="Affordable listings surfaced first so students can spot practical deals without digging through the full catalog."
        icon={Zap}
        accent="text-amber-600"
        viewAllTo="/products?sortBy=price&sortOrder=asc"
      >
        {renderProductGrid(budgetProducts, budgetLoading, 'Budget', 'bg-amber-500 text-white')}
      </SectionShell>

      {user && recentlyViewed.length > 0 && (
        <SectionShell
          title="Pick Up Where You Left Off"
          description="Quick access to products you explored recently — continue comparing and buying."
          icon={Package}
          accent="text-violet-600"
          viewAllTo="/products"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {recentlyViewed.map((product) => (
              <ProductCard
                key={`home-recent-${product._id}`}
                product={product}
                highlightLabel="Viewed"
                highlightTone="bg-violet-500 text-white"
              />
            ))}
          </div>
        </SectionShell>
      )}

      <StatsBand 
        liveListingCount={liveListingCount} 
        budgetPickCount={budgetPickCount} 
        categoryCount={categories.length} 
      />
    </PageShell>
  );
};

export default HomePage;
