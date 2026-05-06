import React from 'react';
import { User, MapPin, Star, Mail } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { getCampusPickupLabel } from '../../../lib/campus';

const getTrustLabelColor = (colorStr) => {
  const map = {
    green: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-500/20 text-blue-700 border-blue-200',
    gray: 'bg-gray-500/20 text-gray-700 border-gray-200',
    emerald: 'bg-emerald-500/20 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-500/20 text-amber-700 border-amber-200',
    purple: 'bg-purple-500/20 text-purple-700 border-purple-200',
  };
  return map[colorStr] || map.gray;
};

export const SellerReputationSection = ({ 
  seller, 
  sellerProfile, 
  isOwner, 
  reviews, 
  existingReview, 
  reviewForm, 
  setReviewForm, 
  onReviewSubmit, 
  isReviewPending 
}) => {
  return (
    <div className="space-y-8">
      {/* Seller Summary Card */}
      <Card className="rounded-4xl border-0 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-primary-200/30 rounded-full blur-3xl" />
        <CardContent className="p-8 relative z-10">
          <h3 className="text-xl font-black tracking-tight text-gray-900 mb-6">Seller</h3>
          <div className="flex items-center gap-5 mb-8">
            <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl">
              {seller?.name?.[0] || <User className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{seller?.name || 'Unknown Seller'}</p>
              <p className="text-gray-500 text-sm flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {seller ? getCampusPickupLabel(seller.location) : 'Location unavailable'}
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                <span>
                  {seller?.reviewCount
                    ? `${Number(seller.averageRating || 0).toFixed(1)} (${seller.reviewCount} review${seller.reviewCount === 1 ? '' : 's'})`
                    : 'No seller reviews yet'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {sellerProfile?.trustSignals?.trustLabels?.map(label => (
                  <Badge key={label.key} className={`border outline-hidden whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md bg-white/10 ${getTrustLabelColor(label.color)}`}>
                    {label.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {seller?.email && (
              <a href={`mailto:${seller.email}`} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                {seller.email}
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Reviews Section */}
      <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Seller Ratings & Reviews</h3>
              <p className="mt-1 text-sm text-gray-600">
                {seller?.reviewCount || 0} review{seller?.reviewCount === 1 ? '' : 's'} about this seller
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-amber-700">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-semibold">{seller?.averageRating || 0}/5</span>
            </div>
          </div>

          {!isOwner && seller && (
            <form onSubmit={onReviewSubmit} className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-800">
                  {existingReview ? 'Update your seller review' : 'Review this seller'}
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                      className="rounded-full p-1 text-amber-500 transition-transform hover:scale-110"
                    >
                      <Star className={`h-5 w-5 ${rating <= reviewForm.rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Share how the seller communicated, accuracy of the listing, and overall experience."
                className="mb-4 bg-white"
              />
              <Button type="submit" disabled={isReviewPending}>
                {isReviewPending ? 'Saving...' : existingReview ? 'Update Seller Review' : 'Submit Seller Review'}
              </Button>
            </form>
          )}

          {reviews.length ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous user'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {review.comment || 'No written feedback provided.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
              No seller reviews yet. Be the first to share feedback about this seller.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
