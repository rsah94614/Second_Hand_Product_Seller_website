import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, ArrowLeft, AlertCircle } from 'lucide-react';
import { submitSellerReview } from '../api/userApi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent!",
};

const QUICK_TAGS = [
  "Quick response",
  "Item as described",
  "Easy pickup",
  "Great communication",
  "Fair price"
];

const ReviewSellerPage = () => {
  const { sellerId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => submitSellerReview(sellerId, {
      orderId,
      rating,
      comment: comment.trim(),
    }),
    onSuccess: () => {
      toast.success("Review submitted. Thank you! 🎉");
      navigate(-1);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || "Failed to submit review";
      toast.error(msg);
    }
  });

  if (!sellerId || !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center p-8 rounded-3xl shadow-sm border-gray-100">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Missing Order Info</h2>
            <p className="text-gray-500 mb-8">This review link is missing order details. Please go back and try again.</p>
            <Button onClick={() => navigate(-1)} className="w-full h-12 rounded-full font-bold">Go Back</Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleTag = (tag) => {
    if (comment.includes(tag)) {
      setComment(prev => prev.replace(tag, "").replace(/^[,\s]+|[,\s]+$/g, "").trim());
    } else {
      setComment(prev => prev ? `${prev}, ${tag}` : tag);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8 py-10">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-gray-900">Rate Seller</h1>
        </div>

        {/* Rating Card */}
        <Card className="rounded-3xl border-gray-100 shadow-sm mb-6">
          <CardContent className="p-6 md:p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your experience</p>
            <h2 className="text-xl font-bold text-gray-900 mb-6">How was your deal?</h2>
            
            <div className="flex flex-col items-center py-6">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-12 h-12 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-transparent'}`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-lg font-bold text-amber-500">{RATING_LABELS[rating]}</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {QUICK_TAGS.map((tag) => {
                const isSelected = comment.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-primary-600 text-white border-primary-600' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Comment Card */}
        <Card className="rounded-3xl border-gray-100 shadow-sm mb-8">
          <CardContent className="p-6 md:p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Add a comment (optional)</p>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share more about your experience..."
                maxLength={600}
                className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700"
              />
              <p className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                {comment.length}/600
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={() => mutation.mutate()} 
          disabled={mutation.isPending}
          className="w-full h-14 rounded-full text-lg font-bold shadow-lg shadow-primary-500/20"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
        
      </main>
      <Footer />
    </div>
  );
};

export default ReviewSellerPage;
