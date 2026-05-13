import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';
import { getProductCategories } from '../api/productApi';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions';

const PAGE_SIZE = 8;

const getFiltersFromSearchParams = (searchParams) => ({
  search: searchParams.get('search') || '',
  category: searchParams.get('category') || '',
  minPrice: searchParams.get('minPrice') || '',
  maxPrice: searchParams.get('maxPrice') || '',
  sortBy: searchParams.get('sortBy') || 'createdAt',
  sortOrder: searchParams.get('sortOrder') || 'desc',
});

const hasExpandedFilters = (filters) =>
  Boolean(
    filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
  );

const fetchProducts = async ({ pageParam = null, filters }) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== 'page' && key !== 'cursor') params.append(key, value);
  });
  if (pageParam) params.set('cursor', pageParam);
  params.set('limit', PAGE_SIZE);
  const res = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`);
  return res.data;
};

export const useProductListLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState(() => getFiltersFromSearchParams(searchParams));
  const loaderRef = useRef(null);

  useEffect(() => {
    const nextFilters = getFiltersFromSearchParams(searchParams);
    setFilters(nextFilters);
    setShowFilterPanel(hasExpandedFilters(nextFilters));
  }, [searchParams]);

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const categories = useMemo(() => {
    const names = categoryResponse?.categories?.map((c) => c.name) || DEFAULT_PRODUCT_CATEGORIES;
    return [...new Set(names)];
  }, [categoryResponse]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: ({ pageParam = null }) => fetchProducts({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    keepPreviousData: true,
  });

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const updateFiltersAndUrl = (nextFilters) => {
    setFilters(nextFilters);
    const nextSearchParams = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) nextSearchParams.set(key, value);
    });
    setSearchParams(nextSearchParams);
  };

  const handleFilterChange = (key, value) => {
    updateFiltersAndUrl({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const cleared = {
      search: '', category: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', sortOrder: 'desc',
    };
    setFilters(cleared);
    setSearchParams({});
    setShowFilterPanel(false);
  };

  const allProducts = useMemo(() => {
    const raw = data?.pages?.flatMap((p) => p.products) ?? [];
    const seen = new Set();
    return raw.filter((p) => {
      if (!p?._id || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [data]);

  const totalCount = data?.pages?.[0]?.total ?? 0;
  const hasActiveFilters = Boolean(filters.search || filters.category || filters.minPrice || filters.maxPrice);

  return {
    filters,
    categories,
    allProducts,
    totalCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    showFilterPanel,
    setShowFilterPanel,
    hasActiveFilters,
    loaderRef,
    handleFilterChange,
    updateFiltersAndUrl,
    clearFilters,
    refetch,
  };
};
