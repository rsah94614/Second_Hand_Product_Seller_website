import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { PRODUCT_CONDITIONS } from '../../../config/productOptions';

export const ProductFormFields = ({ formData, categories, onChange, onSelectChange }) => {
  return (
    <>
      <div className="flex flex-col">
        <label htmlFor="title" className="form-label">
          Product Title *
        </label>
        <Input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={onChange}
          placeholder="What are you selling?"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="description" className="form-label">
          Description *
        </label>
        <Textarea
          id="description"
          name="description"
          required
          value={formData.description}
          onChange={onChange}
          placeholder="Describe your product in detail..."
          rows="4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="form-label">
            Category *
          </label>
          <Select
            value={formData.category || undefined}
            onValueChange={(val) => onSelectChange('category', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="condition" className="form-label">
            Condition *
          </label>
          <Select
            value={formData.condition || undefined}
            onValueChange={(val) => onSelectChange('condition', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Condition" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CONDITIONS.map((condition) => (
                <SelectItem key={condition} value={condition}>{condition}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="form-label">
            Price (₹) *
          </label>
          <Input
            type="number"
            id="price"
            name="price"
            required
            min="0"
            value={formData.price}
            onChange={onChange}
            placeholder="0"
          />
        </div>
      </div>
    </>
  );
};
