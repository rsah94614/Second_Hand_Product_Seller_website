import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Upload, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    contactInfo: {
      phone: '',
      email: '',
    },
  });
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => axios.get(import.meta.env.VITE_BACKEND_URL + `/api/products/${id}`).then(res => res.data),
    enabled: !!id,
    onSuccess: (data) => {
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        category: data.category || '',
        condition: data.condition || '',
        location: data.location || '',
        contactInfo: {
          phone: data.contactInfo?.phone || '',
          email: data.contactInfo?.email || '',
        },
      });

      setImages(
        data.images?.map((img, index) => ({
          id: `existing-${index}`,
          url: img,
          isExisting: true,
        })) || []
      );
    },
  });


  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports',
    'Books', 'Vehicles', 'Real Estate', 'Services', 'Other'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      isExisting: false
    }));

    setNewImages(prev => [...prev, ...newImageFiles].slice(0, 5 - images.length));
  };

  const removeImage = (id) => {
    const imageToRemove = [...images, ...newImages].find(img => img.id === id);
    if (imageToRemove && !imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    if (imageToRemove?.isExisting) {
      setImages(prev => prev.filter(img => img.id !== id));
    } else {
      setNewImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allImages = [...images, ...newImages];
    if (allImages.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'contactInfo') {
          formDataToSend.append('contactInfo', JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });

      // Add existing images
      images.forEach((image) => {
        if (image.isExisting) {
          formDataToSend.append('existingImages', image.url);
        }
      });

      // Add new images
      newImages.forEach((image) => {
        formDataToSend.append('images', image.file);
      });

      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Product updated successfully!');
        navigate(`/products/${id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update product');
      }
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h1>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const allImages = [...images, ...newImages];

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="container py-8 max-w-5xl">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit Product</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className='flex flex-col'>
                <label htmlFor="title" className="form-label">
                  Product Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input border rounded py-2 pr-3 pl-3"
                  placeholder="What are you selling?"
                />
              </div>

              {/* Description */}
              <div className='flex flex-col'>
                <label htmlFor="description" className="form-label">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea border rounded py-1 pr-3 pl-3"
                  placeholder="Describe your product in detail..."
                  rows="4"
                />
              </div>

              {/* Condition and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="condition" className="form-label">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    required
                    value={formData.condition}
                    onChange={handleChange}
                    className="form-select border rounded"
                  >
                    <option value="">Select Condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="form-label">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select border rounded"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className='flex flex-col'>
                  <label htmlFor="price" className="form-label">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-input border rounded py-1 pr-3 pl-3"
                    placeholder="0"
                  />
                </div>


                <div className='flex flex-col'>
                  <label htmlFor="location" className="form-label">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input border rounded py-1 pr-3 pl-3"
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className='flex flex-col'>
                    <label htmlFor="contactInfo.phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="contactInfo.phone"
                      name="contactInfo.phone"
                      value={formData.contactInfo.phone}
                      onChange={handleChange}
                      className="form-input border  rounded py-1 pl-3 pr-3"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className='flex flex-col'>
                    <label htmlFor="contactInfo.email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contactInfo.email"
                      name="contactInfo.email"
                      value={formData.contactInfo.email}
                      onChange={handleChange}
                      className="form-input border rounded py-1 pr-3 pl-3"
                      placeholder="Your email"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="form-label">
                  Product Images * (Max 5)
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.preview || image.url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {allImages.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Add Image</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 py-2 px-4 rounded text-white"
                >
                  {isLoading ? 'Updating...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/products/${id}`)}
                  className="border rounded py-2 px-4"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
