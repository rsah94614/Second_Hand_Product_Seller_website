import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { useProductDetail } from '../hooks/useProductDetail';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { ProductMetaInfo } from '../components/ProductMetaInfo';
import { ActionSidebar } from '../components/ActionSidebar';
import { SellerReputationSection } from '../components/SellerReputationSection';
import { ProductReportForm } from '../components/ProductReportForm';
import { RelatedProductsSection } from '../components/RelatedProductsSection';

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const {
    product,
    isLoading,
    error,
    relatedProducts,
    sellerProfile,
    currentImageIndex,
    setCurrentImageIndex,
    quantity,
    setQuantity,
    reviewForm,
    setReviewForm,
    reportForm,
    setReportForm,
    isInCart,
    isAvailable,
    isWishlisted,
    isOwner,
    user,
    sellerReviews,
    existingReview,
    handleDelete,
    handleShare,
    handleReviewSubmit,
    handleReportSubmit,
    addToCart,
    toggleWishlist,
    isReviewPending,
    isReportPending,
    isAddToCartPending,
    isWishlistPending,
  } = useProductDetail();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-[280px] sm:h-[400px] md:h-[500px] bg-gray-200 rounded-2xl" />
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-24 w-24 bg-gray-200 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />
      <main className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12">
            <ProductImageGallery 
              product={product} 
              currentIndex={currentImageIndex} 
              onIndexChange={setCurrentImageIndex} 
            />

            <div className="flex flex-col animate-fade-in">
              <ProductMetaInfo 
                product={product} 
                isOwner={isOwner} 
                userRole={user?.role} 
                onDelete={handleDelete} 
              />

              <SellerReputationSection 
                seller={product.seller} 
                sellerProfile={sellerProfile}
                isOwner={isOwner}
                reviews={sellerReviews}
                existingReview={existingReview}
                reviewForm={reviewForm}
                setReviewForm={setReviewForm}
                onReviewSubmit={handleReviewSubmit}
                isReviewPending={isReviewPending}
              />

              <div className="mb-8 mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              </div>

              <div className="mt-auto">
                <ActionSidebar 
                  product={product}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  isAvailable={isAvailable}
                  isInCart={isInCart}
                  isWishlisted={isWishlisted}
                  isOwner={isOwner}
                  onAddToCart={addToCart}
                  onOrderNow={() => navigate(`/order/${product._id}`)}
                  onWishlistToggle={toggleWishlist}
                  onShare={handleShare}
                  isAddToCartPending={isAddToCartPending}
                  isWishlistPending={isWishlistPending}
                />
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-8" /> {/* Placeholder for alignment if needed, or moved reviews here */}
            <div className="space-y-8">
              {!isOwner && (
                <ProductReportForm 
                  reportForm={reportForm}
                  setReportForm={setReportForm}
                  onReportSubmit={handleReportSubmit}
                  isPending={isReportPending}
                  hasSeller={!!product.seller}
                />
              )}
            </div>
          </div>

          <RelatedProductsSection 
            products={relatedProducts} 
            category={product.category} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
