import axios from "axios";
import { useAuth } from "../context/AuthContext";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,  //added
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and there's no originalRequest._retry flag,
    // it might be due to an expired access token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          "http://localhost:8000/api/token/refresh/",
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;
        localStorage.setItem("token", access);
        axios.defaults.headers.common["Authorization"] = "Bearer " + access;
        originalRequest.headers["Authorization"] = "Bearer " + access;

        return axiosInstance(originalRequest);
      } catch (error) {
        console.log("Refresh token is invalid or expired");
        // Handle invalid refresh token (e.g., logout the user)
        const { logout } = useAuth();
        logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
