import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData properly - remove Content-Type to let browser set it
    if (config.data instanceof FormData) {
      console.log("FormData detected - removing Content-Type header");
      // Remove any Content-Type header for FormData requests
      delete config.headers["Content-Type"];
    } else {
      // Only set Content-Type for non-FormData requests
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is an authentication error (invalid/expired token) vs authorization error (insufficient permissions)
      const errorMessage = error.response?.data?.message || "";

      // Only logout for authentication errors, not authorization errors
      if (
        errorMessage.toLowerCase().includes("invalid token") ||
        errorMessage.toLowerCase().includes("expired") ||
        errorMessage.toLowerCase().includes("malformed") ||
        !errorMessage.includes("Unauthorized")
      ) {
        // Token expired or invalid - logout user
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      // For authorization errors (like "Unauthorized - Only recipe authors..."), don't logout
      // Just let the error bubble up to be handled by the component
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.delete("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Recipes API
export const recipesAPI = {
  getAll: (params) => api.get("/recipes", { params }),
  
  // Optimized getById with caching headers for better performance
  getById: (id) => api.get(`/recipes/${id}`, {
    headers: {
      'Cache-Control': 'max-age=300', // Cache for 5 minutes
      'If-Modified-Since': new Date(Date.now() - 5 * 60 * 1000).toUTCString(),
    },
    timeout: 5000, // Shorter timeout for single recipe fetch
  }),
  
  // Optimized method to get recipe with ingredients in parallel
  getByIdWithIngredients: async (id) => {
    try {
      // Fetch recipe and ingredients list in parallel for faster loading
      const [recipeResponse, ingredientsResponse] = await Promise.all([
        api.get(`/recipes/${id}`, {
          headers: {
            'Cache-Control': 'max-age=300',
            'If-Modified-Since': new Date(Date.now() - 5 * 60 * 1000).toUTCString(),
          },
          timeout: 5000,
        }),
        api.get("/ingredients", {
          headers: {
            'Cache-Control': 'max-age=600', // Cache ingredients for 10 minutes
          },
          timeout: 3000,
        })
      ]);
      
      return {
        recipe: recipeResponse.data,
        ingredients: ingredientsResponse.data || [],
      };
    } catch (error) {
      // If parallel fetch fails, fallback to sequential
      console.warn('Parallel fetch failed, falling back to sequential:', error.message);
      const recipeResponse = await api.get(`/recipes/${id}`);
      return {
        recipe: recipeResponse.data,
        ingredients: [],
      };
    }
  },
  
  create: (recipeData) => api.post("/recipes", recipeData),
  update: (id, recipeData) => api.patch(`/recipes/${id}`, recipeData),
  delete: (id) => api.delete(`/recipes/${id}`),
  findByIngredients: (ingredientIds, options = {}) =>
    api.post("/recipes/find_by_ingredients", {
      ingredient_ids: ingredientIds,
      ...options,
    }),
  getCategories: () => api.get("/recipes/categories"),
  getPopular: () => api.get("/recipes/popular"),
  getMakeable: (ingredientIds) =>
    api.get("/recipes/makeable", {
      params: { ingredient_ids: ingredientIds },
    }),
};

// Ingredients API
export const ingredientsAPI = {
  // Optimized getAll with caching for better performance
  getAll: () => api.get("/ingredients", {
    headers: {
      'Cache-Control': 'max-age=600', // Cache for 10 minutes
    },
    timeout: 3000, // Shorter timeout for ingredients list
  }),
  getById: (id) => api.get(`/ingredients/${id}`),
  getCategorized: () => api.get("/ingredients/categorized"),
  getCategories: () => api.get("/ingredients/categories"),
  create: (data) => api.post("/ingredients", data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
  search: (query) => api.get(`/ingredients/search?q=${query}`),
  byCategory: (category) => api.get(`/ingredients/by_category/${category}`),

  // Admin-only category management
  createCategory: (data) => api.post("/ingredients/categories", data),
  updateCategory: (id, data) => api.put(`/ingredients/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/ingredients/categories/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats").then((res) => res.data),
  getMyRecipes: () => api.get("/dashboard/my_recipes").then((res) => res.data),
  getAllRecipes: () => api.get("/dashboard/all_recipes").then((res) => res.data),
  getDashboard: () => api.get("/dashboard").then((res) => res.data),
};

// Image upload helper
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export default api;
