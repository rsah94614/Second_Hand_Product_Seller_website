import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const CampusMeetupForm = ({ register, errors, onSubmit, isPending }) => {
  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl md:text-2xl text-gray-900">Campus Meetup Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-8 pt-2">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name*
            </label>
            <Input 
              type="text" 
              {...register('fullName', { required: 'Full name is required' })} 
              placeholder="John Doe" 
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input type="email" {...register('email')} placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostel / Department / Meetup Spot*</label>
            <Input 
              type="text" 
              {...register('addressLine1', { required: 'Pickup point is required' })} 
              placeholder="Girls Hostel, Economics Dept., Library gate..." 
            />
            {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Note</label>
              <Input type="text" {...register('addressLine2')} placeholder="Preferred time, block, floor, or extra directions" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nearby Landmark</label>
              <Input type="text" {...register('landmark')} placeholder="Near canteen, admin block, hostel gate" />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Orders on CampusMitra are handled as on-campus meetups. Location will be saved under Gauhati University, Guwahati, Assam.
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-4 text-base shadow-lg shadow-primary-600/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
