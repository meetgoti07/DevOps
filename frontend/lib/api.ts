import axios, { AxiosResponse, AxiosError } from "axios";

// API Gateway URL - hardcoded for production
const API_GATEWAY_URL = "http://136.113.85.233";

// Service URLs - all go through API Gateway
const USER_SERVICE_URL = API_GATEWAY_URL;
const MENU_SERVICE_URL = API_GATEWAY_URL;
const ORDER_SERVICE_URL = API_GATEWAY_URL;
const QUEUE_SERVICE_URL = API_GATEWAY_URL;
const PAYMENT_SERVICE_URL = API_GATEWAY_URL;

// Create axios instances for each service
const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export service-specific API instances
export const userApi = createApiInstance(USER_SERVICE_URL);
export const menuApi = createApiInstance(MENU_SERVICE_URL);
export const orderApi = createApiInstance(ORDER_SERVICE_URL);
export const queueApi = createApiInstance(QUEUE_SERVICE_URL);
export const paymentApi = createApiInstance(PAYMENT_SERVICE_URL);

// Keep default export for backward compatibility
export default userApi;
