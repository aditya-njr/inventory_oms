import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function formatApiError(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
  }
  return error.response?.data?.message || error.message || 'An unexpected error occurred';
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = new Error(formatApiError(error));
    normalizedError.status = error.response?.status;
    normalizedError.original = error;
    return Promise.reject(normalizedError);
  }
);

export const productsApi = {
  list: () => client.get('/products'),
  get: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
};

export const customersApi = {
  list: () => client.get('/customers'),
  get: (id) => client.get(`/customers/${id}`),
  create: (data) => client.post('/customers', data),
  delete: (id) => client.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: () => client.get('/orders'),
  get: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  delete: (id) => client.delete(`/orders/${id}`),
};

export const dashboardApi = {
  summary: () => client.get('/dashboard/summary'),
};

export default client;
