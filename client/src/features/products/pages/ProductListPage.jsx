import React from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductCard from '../../../components/ProductCard';
import { useProductListLogic } from '../hooks/useProductListLogic';
import { ProductFilterSidebar } from '../components/ProductFilterSidebar';
import { ProductListHeader } from '../components/ProductListHeader';
import { ProductGridLoader } from '../components/ProductGridLoader';
import { ProductEmptyState } from '../components/ProductEmptyState';

const ProductListPage = () => {
  const {
    filters,
    categories,
    allProducts,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    showFilterPanel,
    setShowFilterPanel,
    hasActiveFilters,
    loaderRef,
    handleFilterChange,
    updateFiltersAndUrl,
    clearFilters,
  } = useProductListLogic();

  const renderContent = () => {
    if (isLoading && allProducts.length === 0) {
      return (
        <ProductGridLoader 
          isFirstLoad={true} 
        />
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl bg-red-50 border border-red-100 p-12 text-center animate-fade-in">
          <p className="text-red-600 font-semibold text-lg">Error loading products.</p>
          <p className="text-red-500 text-sm mt-2">Please refresh the page or try again later.</p>
        </div>
      );
    }

    if (allProducts.length === 0) {
      return <ProductEmptyState onClearFilters={clearFilters} />;
    }

    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 animate-fade-in">
        {allProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-8">
        <ProductFilterSidebar
          filters={filters}
          categories={categories}
          showFilterPanel={showFilterPanel}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="flex-1 min-w-0">
          <ProductListHeader
            totalCount={totalCount}
            filters={filters}
            onFilterChange={handleFilterChange}
            onUpdateFilters={updateFiltersAndUrl}
            showFilterPanel={showFilterPanel}
            setShowFilterPanel={setShowFilterPanel}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
          />

          {renderContent()}

          <ProductGridLoader
            isFirstLoad={false}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            totalCount={totalCount}
            productsCount={allProducts.length}
            loaderRef={loaderRef}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductListPage;
