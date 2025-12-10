import axios from "axios";

// Base URL của backend API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Tạo axios instance với cấu hình mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Restaurant API Service
export const restaurantAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/restaurants", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching restaurant ${id}:`, error);
      throw error;
    }
  },

  getFeatured: async (limit = 50) => {
    try {
      const response = await api.get("/restaurants/featured", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching featured restaurants:", error);
      throw error;
    }
  },

  getCategoryStats: async () => {
    try {
      const response = await api.get("/restaurants/categories/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching category stats:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/restaurants", data);
      return response.data;
    } catch (error) {
      console.error("Error creating restaurant:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/restaurants/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating restaurant ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting restaurant ${id}:`, error);
      throw error;
    }
  },
};

// ----------------------
// Search API Service
// ----------------------
export const searchAPI = {
  advanced: async (params = {}) => {
    try {
      const response = await api.get("/search/advanced", { params });
      return response.data; // { success, total, data }
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw error;
    }
  },
};

// Export default api instance
export default api;
