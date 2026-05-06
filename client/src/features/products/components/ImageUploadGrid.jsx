import React from 'react';
import { Upload, X } from 'lucide-react';

export const ImageUploadGrid = ({ images, onImageChange, onRemoveImage }) => {
  return (
    <div>
      <label className="form-label">
        Product Images * (Max 5)
      </label>
      <p className="text-xs text-amber-600 font-medium mb-3">
        Note: High-risk categories like Electronics, Laptops, Mobile Phones, and Gadgets require at least 2 clear images for safety verification.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square md:aspect-video w-full h-32">
              <img
                src={image.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-lg transform scale-90 group-hover:scale-100 transition-all flex items-center gap-2 font-medium text-sm"
                >
                  <X className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}

          {images.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add Image</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
