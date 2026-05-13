import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { getProductCategories } from '../../products/api/productApi';
import { getRecentlyViewed } from '../../users/api/userApi';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions';

const fetchProducts = (params) =>
  axios.get(`${API_BASE_URL}/api/products`, { params }).then((res) => res.data);

export const useHomeLogic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: categoryResponse } = useQuery({
    queryKey: ['home-product-categories'],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((c) => c.name).slice(0, 10) || DEFAULT_PRODUCT_CATEGORIES.slice(0, 10),
    [categoryResponse]
  );

  const { data: latestProducts, isLoading: latestLoading } = useQuery({
    queryKey: ['home-products-latest'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: budgetProducts, isLoading: budgetLoading } = useQuery({
    queryKey: ['home-products-budget'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'price', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentlyViewedResponse } = useQuery({
    queryKey: ['home-recently-viewed'],
    queryFn: getRecentlyViewed,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const recentlyViewed = (recentlyViewedResponse?.products || []).slice(0, 4);
  const liveListingCount = latestProducts?.total ?? 0;
  const budgetPickCount = budgetProducts?.products?.length ?? 0;

  return {
    user,
    categories,
    latestProducts,
    latestLoading,
    budgetProducts,
    budgetLoading,
    recentlyViewed,
    liveListingCount,
    budgetPickCount,
    handleCategoryClick,
  };
};
