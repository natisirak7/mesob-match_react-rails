import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { Search, ChefHat, Clock, Users } from "lucide-react";
import { recipesAPI } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: recipes,
    isLoading,
    error,
  } = useQuery("recipes", () => recipesAPI.getAll(), {
    select: (response) => response.data || [],
    staleTime: 30 * 1000, // Reduced to 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const filteredRecipes =
    recipes?.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load recipes
          </h3>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Ethiopian Recipes
          </h1>
          <p className="text-lg text-gray-600">
            Discover authentic Ethiopian cuisine from our community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && filteredRecipes.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Try adjusting your search."
                : "No recipes available."}
            </p>
          </div>
        )}

        {!isLoading && filteredRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
                  {recipe.image_url || recipe.image ? (
                    <img
                      src={recipe.image_url || recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      recipe.image_url || recipe.image ? "hidden" : "flex"
                    }`}
                  >
                    <ChefHat className="h-12 w-12 text-primary-400" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {recipe.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {recipe.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {recipe.servings} servings
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
