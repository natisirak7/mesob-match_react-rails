import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { Shield, Plus, Tag, Edit2, Trash2, Save, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ingredientsAPI } from "../../services/api";
import toast from "react-hot-toast";

const CategoryManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Default categories for Ethiopian cooking
  const defaultCategories = [
    "spices",
    "vegetables",
    "meat",
    "grains",
    "legumes",
    "dairy",
    "oils",
    "herbs",
    "fruits",
    "nuts",
    "other",
  ];

  // All React hooks must be called before any conditional returns
  const { data: categories, isLoading } = useQuery(
    "ingredientCategories",
    () => ingredientsAPI.getCategories(),
    {
      select: (response) => response.data.categories || defaultCategories,
      staleTime: 5 * 60 * 1000,
    }
  );

  const addCategoryMutation = useMutation(
    (categoryData) => ingredientsAPI.createCategory(categoryData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("ingredientCategories");
        toast.success("Category added successfully!");
        setNewCategory("");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to add category");
      },
    }
  );

  const updateCategoryMutation = useMutation(
    ({ id, categoryData }) => ingredientsAPI.updateCategory(id, categoryData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("ingredientCategories");
        toast.success("Category updated successfully!");
        setEditingId(null);
        setEditValue("");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update category"
        );
      },
    }
  );

  const deleteCategoryMutation = useMutation(
    (categoryId) => ingredientsAPI.deleteCategory(categoryId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("ingredientCategories");
        toast.success("Category deleted successfully!");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to delete category"
        );
      },
    }
  );

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    const categoryKey = newCategory.toLowerCase().replace(/[^a-z0-9]/g, "_");
    addCategoryMutation.mutate({
      name: newCategory.trim(),
      key: categoryKey,
    });
  };

  const handleEditCategory = (category) => {
    setEditingId(category);
    setEditValue(category);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    updateCategoryMutation.mutate({
      id: editingId,
      categoryData: {
        name: editValue.trim(),
        key: editValue.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      },
    });
  };

  const handleDeleteCategory = (category) => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${category}" category? This may affect existing ingredients.`
      )
    ) {
      deleteCategoryMutation.mutate(category);
    }
  };

  // Check if user is admin (AFTER all hooks are called)
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Admin Access Required
          </h3>
          <p className="text-gray-600">
            You need administrator privileges to manage ingredient categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Shield className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Category Management
          </h1>
        </div>

        {/* Add New Category */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-primary-600" />
            Add New Category
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name (e.g., Seafood, Beverages)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || addCategoryMutation.isLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addCategoryMutation.isLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-primary-600" />
            Current Categories ({categories?.length || 0})
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No categories found. Add some categories to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {editingId === category ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit()
                        }
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={
                          !editValue.trim() || updateCategoryMutation.isLoading
                        }
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditValue("");
                        }}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 capitalize">
                          {category.replace(/_/g, " ")}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({category})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit category"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deleteCategoryMutation.isLoading}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
