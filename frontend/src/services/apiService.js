const API_BASE_URL = 'http://localhost:8080/api';

const isProbablyValidToken = (token) => {
  // Basic check: JWTs have 2 dots and are not empty
  return token && token.split('.').length === 3;
};

const PUBLIC_ENDPOINTS = ['/courses', '/users', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification'];

const handleResponse = async (response, endpoint) => {
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403)) {
      // Only redirect for non-public endpoints and only if we're not already on login page
      const isPublic = PUBLIC_ENDPOINTS.some(pub => endpoint.startsWith(pub));
      if (!isPublic && window.location.pathname !== '/login') {
        // Clear auth data but don't redirect immediately
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Let the component handle the redirect
        console.log('Authentication failed for endpoint:', endpoint);
      }
    }
    if (response.status === 204) return null;
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    
    // Create a custom error object that preserves the response structure
    const customError = new Error(error.message || error.error || 'Something went wrong');
    customError.response = error; // Preserve the full error response
    throw customError;
  }
  if (response.status === 204) return null;
  return response.json();
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  // Always start with a fresh headers object
  const headers = {};
  // Only set Content-Type to application/json if not uploading FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  // Only add Authorization header if token is present and looks valid
  if (isProbablyValidToken(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Merge in any custom headers from options (but don't override Authorization)
  Object.assign(headers, options.headers);

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse(response, endpoint);
};

export const fetchCourses = async () => {
  return apiFetch('/courses', { method: 'GET' });
};

export const getProfile = async () => {
  try {
    return await apiFetch('/users/me', { method: 'GET' });
  } catch (error) {
    // If getProfile fails, don't redirect - let the component handle it
    console.error('Failed to get profile:', error);
    throw error;
  }
};

export const updateProfile = async (data) => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });

// Teacher: Get all enrolled students for teacher's courses
export const getEnrolledStudentsForTeacher = async () => {
  return apiFetch('/enrollments/teacher/enrolled-students', { method: 'GET' });
};

// Teacher: Get enrolled students for a specific course
export const getEnrolledStudentsForCourse = async (courseId) => {
  return apiFetch(`/enrollments/teacher/course/${courseId}/enrolled-students`, { method: 'GET' });
};

const apiService = {
  get: async (url) => {
    return apiFetch(url, { method: 'GET' });
  },
  post: async (url, data) => {
    return apiFetch(url, { method: 'POST', body: JSON.stringify(data) });
  },
  put: async (url, data) => {
    return apiFetch(url, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (url) => {
    return apiFetch(url, { method: 'DELETE' });
  }
};

export default apiService;