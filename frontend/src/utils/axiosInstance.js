// frontend/src/utils/axiosInstance.js

import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem("token");

    // If a token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling (e.g., token expiration)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error response status is 401 (Unauthorized) and it's not a login attempt
    // This often means the token is expired or invalid
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes("/auth/login")
    ) {
      console.error("Unauthorized: Token expired or invalid. Redirecting to login.");
      // Clear token and redirect to login page
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");

      window.location.href = "/authentication/sign-in";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
