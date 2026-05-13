import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { createProduct, getProductCategories } from '../api/productApi';
import { parseApiError, formatErrorForDisplay } from '../../../lib/errorHandler';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions';

export const useCreateProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((category) => category.name) || DEFAULT_PRODUCT_CATEGORIES,
    [categoryResponse]
  );

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        contactInfo: {
          email: prev.contactInfo.email || user.email || '',
        },
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
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

  return {
    user,
    formData,
    setFormData,
    images,
    isLoading,
    policyOpen,
    categories,
    setPolicyOpen,
    handleChange,
    handleImageChange,
    removeImage,
    handleSubmit,
  };
};
