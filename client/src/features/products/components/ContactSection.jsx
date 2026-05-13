import React from 'react';
import { Input } from '../../../components/ui/Input';

export const ContactSection = ({ contactInfo, onChange }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
      <p className="mb-4 text-sm text-gray-500">
        We&apos;ve pre-filled your profile contact details. You can keep them or override them just for this listing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label htmlFor="contactInfo.email" className="form-label pr-2">
            Email :
          </label>
          <Input
            type="email"
            id="contactInfo.email"
            name="contactInfo.email"
            value={contactInfo.email}
            onChange={onChange}
            placeholder="Your email"
          />
        </div>
      </div>
    </div>
  );
};
