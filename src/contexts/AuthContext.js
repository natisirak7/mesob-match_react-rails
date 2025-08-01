import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          // Parse saved user data first
          const userData = JSON.parse(savedUser);

          // Set user data immediately from localStorage
          setUser(userData);
          setIsAuthenticated(true);

          // Then verify token is still valid (optional verification)
          try {
            const response = await authAPI.me();
            const freshUserData = response.data;

            // Update with fresh data if verification succeeds
            setUser(freshUserData);
            localStorage.setItem("user", JSON.stringify(freshUserData));
          } catch (verifyError) {
            console.log(
              "Token verification failed, but keeping existing session:",
              verifyError.message
            );
            // Don't clear the session immediately - let the user continue
            // The session will be cleared when they actually make a request that fails
          }
        } catch (parseError) {
          console.error("Error parsing saved user data:", parseError);
          // Clear invalid stored data
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { auth_token: token, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${userData.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { auth_token: token, user: newUser } = response.data;

      // Store token and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(newUser));

      setUser(newUser);
      setIsAuthenticated(true);

      toast.success(`Welcome to MesobMatch, ${newUser.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      const errors = error.response?.data?.errors || [];

      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err));
      } else {
        toast.error(message);
      }

      return { success: false, error: message, errors };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isAuthor = () => {
    return user?.role === "author" || user?.role === "admin";
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isAuthor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
