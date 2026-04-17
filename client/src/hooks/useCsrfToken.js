import { useEffect, useState } from 'react';
import axios from 'axios';
import { getCsrfToken } from '../features/auth/api/authApi';

/**
 * Hook to manage CSRF token
 * Automatically fetches and refreshes CSRF token
 * Adds token to axios headers for all requests
 */
export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCsrfToken = async () => {
    try {
      setLoading(true);
      const data = await getCsrfToken();
      setCsrfToken(data.csrfToken);
      
      // Add CSRF token to axios default headers
      axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
      
      setError(null);
      
      // Refresh token before it expires (refresh at 50 minutes if expiry is 1 hour)
      const refreshTime = (data.expiresIn * 1000) * 0.9; // 90% of expiry time
      setTimeout(fetchCsrfToken, refreshTime);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch CSRF token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch CSRF token in production or if explicitly enabled
    if (import.meta.env.PROD || import.meta.env.VITE_CSRF_ENABLED === 'true') {
      fetchCsrfToken();
    } else {
      setLoading(false);
    }

    return () => {
      // Cleanup: remove CSRF token from headers
      delete axios.defaults.headers.common['X-CSRF-Token'];
    };
  }, []);

  return { csrfToken, loading, error, refreshToken: fetchCsrfToken };
};
