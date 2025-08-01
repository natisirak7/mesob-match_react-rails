import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { BarChart3, ChefHat, Users, BookOpen, Plus, Clock } from "lucide-react";
import { dashboardAPI, recipesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user, isAuthor } = useAuth();
  const [myRecipes, setMyRecipes] = useState([]);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery("dashboardStats", () => dashboardAPI.getStats(), {
    staleTime: 30 * 1000, // Reduced to 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch user's recipes
  const fetchMyRecipes = useCallback(async () => {
    if (!isAuthor()) {
      console.log("❌ User is not author, skipping recipe fetch");
      return;
    }

    const testRegularRecipesAPI = async () => {
      try {
        console.log("🧪 Testing regular recipes API...");
        const response = await recipesAPI.getAll();
        console.log("✅ Regular API works:", response.data?.length, "recipes");

        if (response.data && Array.isArray(response.data)) {
          // Filter recipes by current user if possible
          const userRecipes = response.data.filter(
            (recipe) =>
              recipe.author_id === user?.id || recipe.author?.id === user?.id
          );
          console.log(
            "📝 Found",
            userRecipes.length,
            "recipes for current user"
          );
          setMyRecipes(userRecipes);
        }
      } catch (error) {
        console.error("❌ Regular API also failed:", error);
        if (user?.role === "author" || user?.role === "admin") {
          // Only show error for authors/admins who should have recipes
          console.log(
            "� Dashboard API failed, trying regular API as fallback..."
          );
        }
      }
    };

    console.log("📝 Fetching my recipes...");
    try {
      const response = await dashboardAPI.getMyRecipes();
      console.log("✅ My recipes loaded:", response);
      console.log("🔍 Response type:", typeof response);
      console.log("🔍 Response structure:", response);

      // Backend returns { recipes: [...], total: N }
      const recipesData = Array.isArray(response.recipes)
        ? response.recipes
        : [];
      console.log("🔍 Extracted recipes:", recipesData);
      console.log("🔍 Number of recipes:", recipesData.length);

      setMyRecipes(recipesData);
    } catch (error) {
      console.error("❌ Error fetching my recipes:", error);
      console.error("🔍 Error details:", error.response?.data);
      console.error("📊 Error status:", error.response?.status);
      setMyRecipes([]);

      // Try regular API as fallback
      console.log("🔄 Dashboard API failed, trying regular API as fallback...");
      await testRegularRecipesAPI();

      toast.error("Failed to load your recipes");
    }
  }, [isAuthor, user]);

  useEffect(() => {
    console.log("🔍 Dashboard useEffect triggered");
    console.log("👤 Current user:", user);
    console.log("📝 Is author?", isAuthor());

    if (isAuthor()) {
      console.log("✅ User is author, fetching recipes...");
      fetchMyRecipes();
    } else {
      console.log("❌ User is not author or not logged in");
    }
  }, [isAuthor, user, fetchMyRecipes]);

  // Refetch data when component becomes visible (e.g., navigating back from create recipe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthor()) {
        console.log("🔄 Page became visible, refetching recipes...");
        fetchMyRecipes();
        refetchStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthor, refetchStats, fetchMyRecipes]);

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        await recipesAPI.delete(recipeId);
        // Refetch recipes after deletion
        fetchMyRecipes();
      } catch (error) {
        console.error("Error deleting recipe:", error);
      }
    }
  };

  console.log("🎨 Dashboard render - myRecipes:", myRecipes);
  console.log("📊 myRecipes length:", myRecipes.length);
  console.log("👤 Current user in render:", user);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back, {user?.name}! Here's your MesobMatch overview.
          </p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Recipes"
              value={stats?.total_recipes || 0}
              icon={BookOpen}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Ingredients"
              value={stats?.total_ingredients || 0}
              icon={ChefHat}
              color="bg-green-500"
            />
            <StatCard
              title="Active Users"
              value={stats?.total_users || 0}
              icon={Users}
              color="bg-purple-500"
            />
            <StatCard
              title="My Recipes"
              value={myRecipes?.length || 0}
              icon={BarChart3}
              color="bg-orange-500"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/match"
              className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Recipe Match</h3>
                <p className="text-sm text-gray-600">
                  Find recipes by ingredients
                </p>
              </div>
            </Link>

            <Link
              to="/recipes"
              className="flex items-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <BookOpen className="h-8 w-8 text-secondary-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Browse Recipes</h3>
                <p className="text-sm text-gray-600">Explore all recipes</p>
              </div>
            </Link>
          </div>
        </div>

        {/* My Recipes Management Section */}
        {isAuthor() && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                My Recipes Management
              </h2>
            </div>

            {myRecipes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No recipes yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start creating your first recipe to see it here
                </p>
                <Link
                  to="/create-recipe"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.isArray(myRecipes)
                  ? myRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        {/* Recipe Header with Image */}
                        <div className="relative">
                          <div className="h-64 bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center relative">
                            {recipe.image_url ? (
                              <img
                                src={recipe.image_url}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ChefHat className="h-16 w-16 text-orange-400" />
                            )}
                          </div>

                          {/* Action Buttons - Top Right */}
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Link
                              to={`/edit-recipe/${recipe.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                            >
                              Edit Recipe
                            </Link>
                            <button
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Recipe Content */}
                        <div className="p-6">
                          {/* Title and Description */}
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {recipe.title || recipe.name}
                          </h2>
                          <p className="text-gray-600 mb-4">
                            {recipe.description || "No description available"}
                          </p>

                          {/* Author and Cuisine */}
                          <div className="flex items-center text-sm text-gray-500 mb-4">
                            <span>
                              By {recipe.author?.name || user?.name || "You"}
                            </span>
                            {recipe.cuisine && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{recipe.cuisine} cuisine</span>
                              </>
                            )}
                          </div>

                          {/* Recipe Meta Info */}
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Prep: {recipe.prep_time || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Cook: {recipe.cook_time || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>Serves {recipe.servings || "N/A"}</span>
                            </div>
                            {recipe.difficulty && (
                              <span>Difficulty: {recipe.difficulty}</span>
                            )}
                          </div>

                          {/* Ingredients and Instructions Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Ingredients */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Ingredients
                              </h3>
                              {recipe.ingredients &&
                              recipe.ingredients.length > 0 ? (
                                <ul className="space-y-2">
                                  {recipe.ingredients.map((ingredient, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">
                                        {ingredient.quantity && ingredient.unit
                                          ? `${ingredient.quantity} ${ingredient.unit} `
                                          : ""}
                                        {ingredient.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 italic">
                                  No ingredients listed
                                </p>
                              )}
                            </div>

                            {/* Instructions */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Instructions
                              </h3>
                              {recipe.instructions &&
                              recipe.instructions.length > 0 ? (
                                <ol className="space-y-3">
                                  {recipe.instructions
                                    .slice(0, 4)
                                    .map((instruction, idx) => (
                                      <li key={idx} className="flex gap-3">
                                        <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                          {instruction.step_number || idx + 1}
                                        </span>
                                        <span className="text-gray-700 text-sm">
                                          {instruction.description}
                                        </span>
                                      </li>
                                    ))}
                                  {recipe.instructions.length > 4 && (
                                    <li className="text-gray-500 text-sm italic ml-9">
                                      +{recipe.instructions.length - 4} more
                                      steps...
                                    </li>
                                  )}
                                </ol>
                              ) : (
                                <p className="text-gray-500 italic">
                                  No instructions available
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bottom Actions */}
                          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
                            <Link
                              to={`/recipes/${recipe.id}`}
                              className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-center hover:bg-gray-100 transition-colors font-medium"
                            >
                              View Full Recipe
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
