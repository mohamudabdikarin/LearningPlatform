const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Enhanced token validation
const isProbablyValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if payload is valid JSON and not expired
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Add buffer time (30 seconds) to prevent edge cases where token is about to expire
    return payload.exp ? (payload.exp > now + 30) : true;
  } catch {
    return false;
  }
};

const PUBLIC_ENDPOINTS = [
  '/courses', 
  '/users', 
  '/auth/login', 
  '/auth/register', 
  '/auth/forgot-password', 
  '/auth/reset-password', 
  '/auth/verify-email', 
  '/auth/resend-verification'
];

// Token management utilities
const tokenManager = {
  get: () => localStorage.getItem('token'),
  set: (token) => localStorage.setItem('token', token),
  remove: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isValid: () => isProbablyValidToken(tokenManager.get()),
  // Check if token exists but might be invalid (expired)
  exists: () => !!localStorage.getItem('token')
};

// Enhanced error handling
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

const handleResponse = async (response, endpoint) => {
  // Handle successful responses with no content
  if (response.status === 204) return null;
  
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() || 'An unknown error occurred' };
      }
    } catch {
      errorData = { message: 'Failed to parse error response' };
    }

    // Handle authentication/authorization errors
    if (response.status === 401 || response.status === 403) {
      const isPublic = PUBLIC_ENDPOINTS.some(pub => endpoint.startsWith(pub));
      
      if (!isPublic && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Only remove token if it's actually invalid, not just for permission issues
        if (response.status === 401) {
          tokenManager.remove();
          console.warn('Authentication failed for endpoint:', endpoint);
          
          // Dispatch custom event for auth failure
          window.dispatchEvent(new CustomEvent('auth-failure', { 
            detail: { endpoint, status: response.status } 
          }));
        } else {
          console.warn('Authorization failed (permission issue) for endpoint:', endpoint);
        }
      }
    }
    
    throw new ApiError(
      errorData.message || errorData.error || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  // Parse JSON response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

// Request timeout utility
const withTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Enhanced retry logic
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
};

export const apiFetch = async (endpoint, options = {}) => {
  const { 
    timeout = 30000, 
    retry = false, 
    retryAttempts = 3,
    ...fetchOptions 
  } = options;

  const makeRequest = async () => {
    // Prepare headers
    const headers = { ...fetchOptions.headers };
    
    // Set Content-Type for JSON requests (not for FormData)
    if (!(fetchOptions.body instanceof FormData) && 
        !headers['Content-Type'] && 
        fetchOptions.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add authorization header if token exists
    // We'll send the token even if it might be expired to allow the backend
    // to handle token validation and potential refresh
    const token = tokenManager.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...fetchOptions,
      headers,
      credentials: 'include',
      // Add cache control for GET requests
      ...(fetchOptions.method === 'GET' && {
        cache: 'no-cache'
      })
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return handleResponse(response, endpoint);
  };

  try {
    const requestPromise = retry 
      ? withRetry(makeRequest, retryAttempts)
      : makeRequest();
      
    return await withTimeout(requestPromise, timeout);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Specific API functions with better error handling
export const fetchCourses = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/courses${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch(endpoint, { 
    method: 'GET',
    retry: true // Safe to retry GET requests
  });
};

export const getProfile = async () => {
  try {
    return await apiFetch('/users/me', { 
      method: 'GET',
      retry: true
    });
  } catch (error) {
    console.error('Failed to get profile:', error);
    
    // If it's an auth error, clear local storage
    if (error.status === 401) {
      tokenManager.remove();
    }
    
    throw error;
  }
};

export const updateProfile = async (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Profile data is required');
  }
  
  return apiFetch('/users/me', { 
    method: 'PUT', 
    body: JSON.stringify(data)
  });
};

export const getEnrolledStudentsForTeacher = async () => {
  return apiFetch('/enrollments/teacher/enrolled-students', { 
    method: 'GET',
    retry: true
  });
};

export const getEnrolledStudentsForCourse = async (courseId) => {
  if (!courseId) {
    throw new Error('Course ID is required');
  }
  
  return apiFetch(`/enrollments/teacher/course/${courseId}/enrolled-students`, { 
    method: 'GET',
    retry: true
  });
};

// Enhanced API service with better method signatures
const apiService = {
  get: async (url, params = {}, options = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${url}${queryString ? `?${queryString}` : ''}`;
    
    return apiFetch(endpoint, { 
      method: 'GET', 
      retry: true,
      ...options 
    });
  },
  
  post: async (url, data = null, options = {}) => {
    const body = data ? JSON.stringify(data) : undefined;
    return apiFetch(url, { 
      method: 'POST', 
      body,
      ...options 
    });
  },
  
  put: async (url, data = null, options = {}) => {
    const body = data ? JSON.stringify(data) : undefined;
    return apiFetch(url, { 
      method: 'PUT', 
      body,
      ...options 
    });
  },
  
  patch: async (url, data = null, options = {}) => {
    const body = data ? JSON.stringify(data) : undefined;
    return apiFetch(url, { 
      method: 'PATCH', 
      body,
      ...options 
    });
  },
  
  delete: async (url, options = {}) => {
    return apiFetch(url, { 
      method: 'DELETE',
      ...options 
    });
  },

  // File upload helper
  upload: async (url, formData, options = {}) => {
    if (!(formData instanceof FormData)) {
      throw new Error('Upload data must be FormData');
    }
    
    return apiFetch(url, {
      method: 'POST',
      body: formData,
      timeout: 60000, // Longer timeout for uploads
      ...options
    });
  }
};

// Export token manager for external use
export { tokenManager, ApiError };
export default apiService;
