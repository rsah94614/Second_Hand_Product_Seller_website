import React from 'react';
import { ShoppingBag, CheckCircle, MapPin, PackageCheck, Star, X, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/Dialog';

export const OrderFlowInfoModal = ({ isOpen, onClose, activeTab }) => {
  const isBuying = activeTab === 'buying';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-0 border-gray-100 shadow-2xl">
        <div className="bg-primary-50 p-8 pb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary-100">
            {isBuying ? (
              <ShoppingBag className="w-8 h-8 text-primary-600" />
            ) : (
              <Tag className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <DialogTitle className="text-3xl font-black text-gray-900 mb-3">
            {isBuying ? 'Buying Workflow' : 'Selling Workflow'}
          </DialogTitle>
          <DialogDescription className="text-lg text-gray-600 leading-relaxed font-medium">
            {isBuying
              ? 'Follow these steps to safely purchase items from other students on campus.'
              : 'Follow these steps to successfully sell your items and get paid.'}
          </DialogDescription>
        </div>

        <div className="p-8">
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {isBuying ? (
              // Buying Flow
              <>
                <Step
                  icon={ShoppingBag}
                  title="1. Request Item"
                  description="Find an item you like and click 'Buy Now' or 'Request Deal'. The seller will be notified of your request."
                />
                <Step
                  icon={CheckCircle}
                  title="2. Seller Accepts"
                  description="The seller reviews your request and accepts it. The status changes to 'Accepted'."
                />
                <Step
                  icon={MapPin}
                  title="3. Schedule Meetup"
                  description="Once accepted, you or the seller can propose a campus location and time to meet up (e.g. 'Library at 5PM')."
                />
                <Step
                  icon={PackageCheck}
                  title="4. Meet & Receive"
                  description="Meet the seller, inspect the item, and pay them directly via cash or UPI. The seller marks the item as 'Delivered'."
                />
                <Step
                  icon={Star}
                  title="5. Confirm & Review"
                  description="You confirm that you received the item. The deal is complete! Don't forget to leave a review."
                  isLast
                />
              </>
            ) : (
              // Selling Flow
              <>
                <Step
                  icon={Tag}
                  title="1. Receive Request"
                  description="A buyer requests to purchase your listed item. You will get a notification."
                />
                <Step
                  icon={CheckCircle}
                  title="2. Accept Request"
                  description="Review the buyer's profile and click 'Accept Order' if you agree to sell it to them."
                />
                <Step
                  icon={MapPin}
                  title="3. Schedule Meetup"
                  description="You or the buyer can suggest a safe campus location and time to meet up and complete the transaction."
                />
                <Step
                  icon={PackageCheck}
                  title="4. Meet & Deliver"
                  description="Meet the buyer, receive the payment (cash or UPI), and hand over the item. Then, click 'Mark Delivered'."
                />
                <Step
                  icon={Star}
                  title="5. Buyer Confirms"
                  description="The buyer confirms receipt on their end. The transaction is complete! Both parties can leave a review."
                  isLast
                />
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/50 text-gray-500 hover:bg-white hover:text-gray-900 transition-colors backdrop-blur-sm"
        >
          {/* <X className="w-5 h-5" /> */}
        </button>
      </DialogContent>
    </Dialog>
  );
};

// eslint-disable-next-line no-unused-vars
const Step = ({ icon: Icon, title, description, isLast }) => (
  <div className="relative flex items-start gap-6 group">
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-primary-100 text-primary-600 shadow-sm z-10 group-hover:bg-primary-50 group-hover:scale-110 group-hover:border-primary-200 transition-all duration-300 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-500 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);
