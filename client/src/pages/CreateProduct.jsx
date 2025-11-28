import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CreateProduct = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    location: '',
    contactInfo: {
      phone: '',
      email: '',
    },
  });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports',
    'Books', 'Vehicles', 'Tools', 'Services', 'Other'
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
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  };

  const removeImage = (id) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      console.log("formData before sending:", formData);

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'contactInfo') {
          formDataToSend.append('contactInfo', JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      });

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image.file);        
      });

      const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });


      if (response.ok) {
        const product = await response.json();
        toast.success('Product created successfully!');
        navigate(`/products/${product._id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create product');
      }
    } catch (error) {
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to create a product</h1>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="container max-w-5xl py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">List Your Product</h1>

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
                  className="form-input border rounded py-1 pl-3 pr-3"
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
                  className="form-textarea border rounded pr-3 pl-3"
                  placeholder="Describe your product in detail..."
                  rows="4"
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              {/* Category and Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
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
                    className="form-input border rounded pr-3 pl-3 px-5"
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
                    className="form-input rounded border py-1 pl-3 pr-3"
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className='flex flex-col'>
                    <label htmlFor="contactInfo.phone" className="form-label pr-2">
                      Phone Number :
                    </label>
                    <input
                      type="tel"
                      id="contactInfo.phone"
                      name="contactInfo.phone"
                      value={formData.contactInfo.phone}
                      onChange={handleChange}
                      className="form-input border rounded py-1 pr-2 pl-2"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className='flex flex-col'>
                    <label htmlFor="contactInfo.email" className="form-label pr-2">
                      Email :
                    </label>
                    <input
                      type="email"
                      id="contactInfo.email"
                      name="contactInfo.email"
                      value={formData.contactInfo.email}
                      onChange={handleChange}
                      className="form-input border rounded py-1 pr-2 pl-2"
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
                    {images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.preview}
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

                    {images.length < 5 && (
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

                  {/* {images.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No images selected</p>
                      <label className="btn btn-outline cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        Choose Images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )} */}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col items-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn py-2 rounded bg-blue-600 mb-4 w-2/4 text-white hover:cursor-pointer hover:bg-blue-800"
                >
                  {isLoading ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-secondary border rounded py-2 w-2/4 hover:cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default CreateProduct;
