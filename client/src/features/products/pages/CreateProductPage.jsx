import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
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
import { CAMPUS_LOCATIONS } from '../../../lib/campus';
import { createProduct, getProductCategories } from '../api/productApi';
import { parseApiError, formatErrorForDisplay } from '../../../lib/errorHandler';

const LISTING_POLICIES = [
  {
    icon: '🚀',
    title: 'How CampusMitra Helps You',
    items: [
      'Your listing reaches all verified students on your campus.',
      'Built-in chat so buyers contact you directly — no middlemen.',
      'Wishlist & price-drop alerts bring buyers back to your listing.',
      'Listings auto-expire after 60 days to keep the marketplace fresh (you can relist).',
      'Free platform — no commission or fees ever.',
    ],
  },
  {
    icon: '✅',
    title: 'Listing Guidelines',
    items: [
      'Use clear, honest photos — at least 1 required (2 for electronics).',
      'Set a fair price — you can negotiate in chat.',
      'Describe the actual condition accurately.',
      'Only list items you physically own and can hand over on campus.',
    ],
  },
  {
    icon: '🚫',
    title: 'Not Allowed',
    items: [
      'Counterfeit, stolen, or prohibited items.',
      'Digital goods, services, or subscriptions.',
      'Misleading titles or fake photos.',
      'Listing the same item multiple times simultaneously.',
    ],
  },
  {
    icon: '🤝',
    title: 'Safety & Meetup',
    items: [
      'Always meet in a public campus location (Library, Main Gate, Canteen, etc.).',
      'Never share personal financial details in chat.',
      'Use the in-app confirmation photo after completing a deal.',
      'Report suspicious buyers/sellers immediately.',
    ],
  },
  {
    icon: '💰',
    title: 'Pricing & Payments',
    items: [
      'All payments are handled directly between buyer and seller (cash on meetup).',
      'Never pay in advance before seeing the item.',
      'Disputes can be filed through the app if something goes wrong.',
    ],
  },
  {
    icon: '⚠️',
    title: 'Account Consequences',
    items: [
      'Misleading listings may be removed without notice.',
      'Repeated violations lead to account suspension.',
      'No-shows affect your trust score and reputation.',
      'Verified sellers get a badge — builds buyer confidence.',
    ],
  },
];

const ListingPoliciesModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-6 py-4 border-b border-gray-100 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Listing Policies</h2>
            <p className="text-sm text-gray-500 mt-0.5">Read before you publish</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-6">
          {LISTING_POLICIES.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{section.icon}</span>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-3xl">
          <Button onClick={onClose} className="w-full">Got it</Button>
        </div>
      </div>
    </div>
  );
};

const CreateProductPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    contactInfo: {
      email: '',
    },
  });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((category) => category.name) || DEFAULT_PRODUCT_CATEGORIES,
    [categoryResponse]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      contactInfo: {
        email: prev.contactInfo.email || user.email || '',
      },
    }));
  }, [user]);

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
    const MAX_FILE_SIZE_MB = 5;
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const rejected = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        rejected.push(`${file.name} (not an image)`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        rejected.push(`${file.name} (over ${MAX_FILE_SIZE_MB}MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (rejected.length > 0) {
      toast.error(`Skipped: ${rejected.join(', ')}`);
    }

    const nextImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2, 11),
    }));

    setImages((prev) => [...prev, ...nextImages].slice(0, 5));
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((image) => image.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    const HIGH_RISK_CATEGORIES = ['Electronics', 'Mobile Phones', 'Laptops', 'Gadgets'];
    if (HIGH_RISK_CATEGORIES.includes(formData.category) && images.length < 2) {
      toast.error('High-risk categories require at least 2 images for safety.');
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
        payload.append('images', image.file);
      });

      const product = await createProduct(payload);
      toast.success('Product created successfully!');
      navigate(`/products/${product._id}`);
    } catch (error) {
      const parsedError = parseApiError(error, "Failed to create product");
      const code = parsedError.code;

      if (code === "PROFILE_INCOMPLETE") {
        toast.error(`Please complete your profile first.\n\n${parsedError.details}`, { duration: 5000 });
      } else if (code === "DAILY_LISTING_CAP" || code === "TOTAL_LISTING_CAP" || code === "MIN_IMAGES_REQUIRED") {
        toast.error(parsedError.message, { duration: 5000 });
      } else {
        toast.error(formatErrorForDisplay(parsedError), { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to create a product</h1>
          <Button onClick={() => navigate('/login')}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ListingPoliciesModal open={policyOpen} onClose={() => setPolicyOpen(false)} />
      <div className="px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-3xl border-gray-100 shadow-sm animate-fade-in">
            <CardHeader className="pb-2 text-center">
              <div className="flex items-center justify-center gap-3">
                <CardTitle className="text-3xl text-gray-800">Create Listing</CardTitle>
                <button
                  type="button"
                  onClick={() => setPolicyOpen(true)}
                  className="h-8 w-8 rounded-full bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors"
                  title="Listing policies & guidelines"
                >
                  <Info className="w-4 h-4 text-primary-600" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Read our{' '}
                <button
                  type="button"
                  onClick={() => setPolicyOpen(true)}
                  className="text-primary-600 hover:underline font-medium"
                >
                  listing guidelines
                </button>
                {' '}before publishing.
              </p>
            </CardHeader>
            <CardContent className="p-8 pt-4">

              <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
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
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value }))}
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
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>

                </div>

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
                        value={formData.contactInfo.email}
                        onChange={handleChange}
                        placeholder="Your email"
                      />
                    </div>
                  </div>
                </div>

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
                              onClick={() => removeImage(image.id)}
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
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mb-4 w-2/4"
                  >
                    {isLoading ? 'Creating...' : 'Create Listing'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-2/4"
                  >
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

export default CreateProductPage;
