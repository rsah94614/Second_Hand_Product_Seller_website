import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { DEFAULT_PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '../../../config/productOptions';
import { getProduct, getProductCategories, updateProduct } from '../api/productApi';
import { useAuth } from '../../../context/AuthContext';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!product) {
      return;
    }

    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || '',
      condition: product.condition || '',
      location: product.location || user?.location || '',
      contactInfo: {
        phone: product.contactInfo?.phone || user?.phone || '',
        email: product.contactInfo?.email || user?.email || '',
      },
    });

    setImages(
      product.images?.map((image, index) => ({
        id: `existing-${index}`,
        url: image,
        isExisting: true,
      })) || []
    );
    setNewImages([]);
  }, [product, user]);

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((category) => category.name) || DEFAULT_PRODUCT_CATEGORIES,
    [categoryResponse]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const nextImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2, 11),
      isExisting: false,
    }));

    setNewImages((prev) => [...prev, ...nextImages].slice(0, 5 - images.length));
  };

  const removeImage = (idToRemove) => {
    const imageToRemove = [...images, ...newImages].find((image) => image.id === idToRemove);
    if (imageToRemove && !imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    if (imageToRemove?.isExisting) {
      setImages((prev) => prev.filter((image) => image.id !== idToRemove));
      return;
    }

    setNewImages((prev) => prev.filter((image) => image.id !== idToRemove));
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
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'contactInfo') {
          payload.append('contactInfo', JSON.stringify(value));
          return;
        }
        payload.append(key, value);
      });

      images.forEach((image) => {
        if (image.isExisting) {
          payload.append('existingImages', image.url);
        }
      });

      newImages.forEach((image) => {
        payload.append('images', image.file);
      });

      await updateProduct(id, payload);
      toast.success('Product updated successfully!');
      navigate(`/products/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const allImages = [...images, ...newImages];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-3xl border-gray-100 shadow-sm animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-gray-800">Edit Listing</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4">

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col">
                <label htmlFor="title" className="form-label">Product Title *</label>
                <Input type="text" id="title" name="title" required value={formData.title} onChange={handleChange} placeholder="What are you selling?" />
              </div>

              <div className="flex flex-col">
                <label htmlFor="description" className="form-label">Description *</label>
                <Textarea id="description" name="description" required value={formData.description} onChange={handleChange} placeholder="Describe your product in detail..." rows="4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="condition" className="form-label">Condition *</label>
                  <Select value={formData.condition || undefined} onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CONDITIONS.map((condition) => <SelectItem key={condition} value={condition}>{condition}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="category" className="form-label">Category *</label>
                  <Select value={formData.category || undefined} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label htmlFor="price" className="form-label">Price (₹) *</label>
                  <Input type="number" id="price" name="price" required min="0" value={formData.price} onChange={handleChange} placeholder="0" />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="location" className="form-label">Location *</label>
                  <Input type="text" id="location" name="location" required value={formData.location} onChange={handleChange} placeholder="City, State" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <p className="mb-4 text-sm text-gray-500">
                  These fields use the saved listing details first and fall back to your current profile if anything was missing.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="contactInfo.phone" className="form-label">Phone Number</label>
                    <Input type="tel" id="contactInfo.phone" name="contactInfo.phone" value={formData.contactInfo.phone} onChange={handleChange} placeholder="Your phone number" />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="contactInfo.email" className="form-label">Email</label>
                    <Input type="email" id="contactInfo.email" name="contactInfo.email" value={formData.contactInfo.email} onChange={handleChange} placeholder="Your email" />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Product Images * (Max 5)</label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allImages.map((image) => (
                      <div key={image.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square md:aspect-video w-full h-32">
                        <img src={image.preview || image.url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={() => removeImage(image.id)} 
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-lg transform scale-90 group-hover:scale-100 transition-all flex items-center gap-2 font-medium text-sm"
                          >
                            <X className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {allImages.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Add Image</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Listing'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(`/products/${id}`)}>
                  Cancel
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EditProductPage;
