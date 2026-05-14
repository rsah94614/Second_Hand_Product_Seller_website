import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

export const CheckoutDialog = ({ 
  isOpen, 
  onOpenChange, 
  shippingDetails, 
  onDetailsChange, 
  onConfirm, 
  isPending 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl z-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Campus Checkout</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Full Name</label>
            <Input 
              value={shippingDetails.fullName} 
              onChange={e => onDetailsChange(prev => ({...prev, fullName: e.target.value}))} 
              placeholder="John Doe" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Hostel / Department / Meetup Spot</label>
            <Input 
              value={shippingDetails.addressLine1} 
              onChange={e => onDetailsChange(prev => ({...prev, addressLine1: e.target.value}))} 
              placeholder="Girls Hostel, Admin Block, Library gate..." 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Additional Note</label>
            <Input 
              value={shippingDetails.addressLine2} 
              onChange={e => onDetailsChange(prev => ({...prev, addressLine2: e.target.value}))} 
              placeholder="Preferred time, block, floor, or extra directions" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nearby Landmark</label>
            <Input 
              value={shippingDetails.landmark} 
              onChange={e => onDetailsChange(prev => ({...prev, landmark: e.target.value}))} 
              placeholder="Near canteen, hostel gate, admin block" 
            />
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Checkout is campus-specific, so location will be recorded under Gauhati University, Guwahati, Assam.
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
