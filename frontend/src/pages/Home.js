import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import {
  Search,
  ChefHat,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";
import { recipesAPI, ingredientsAPI } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";

const Home = () => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch popular recipes for hero section
  const { data: popularRecipes, isLoading: recipesLoading } = useQuery(
    "popularRecipes",
    () => recipesAPI.getPopular(),
    {
      select: (response) => response.data.slice(0, 3),
      staleTime: 10 * 60 * 1000,
    }
  );

  // Fetch ingredients for search
  const { data: ingredients } = useQuery(
    "ingredients",
    () => ingredientsAPI.getAll(),
    {
      select: (response) => response.data,
      staleTime: 15 * 60 * 1000,
    }
  );

  const filteredIngredients =
    ingredients
      ?.filter(
        (ingredient) =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !selectedIngredients.find((selected) => selected.id === ingredient.id)
      )
      .slice(0, 8) || [];

  const addIngredient = (ingredient) => {
    setSelectedIngredients([...selectedIngredients, ingredient]);
    setSearchQuery("");
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(
      selectedIngredients.filter((ing) => ing.id !== ingredientId)
    );
  };

  const stats = [
    { label: "Ethiopian Recipes", value: "500+", icon: BookOpen },
    { label: "Active Cooks", value: "1,200+", icon: Users },
    { label: "Ingredients", value: "300+", icon: ChefHat },
    { label: "Recipe Matches", value: "10,000+", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-6">
              Discover Ethiopian Recipes
              <span className="block text-primary-600">
                Based on Your Ingredients
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              MesobMatch helps you find authentic Ethiopian recipes using
              ingredients you already have. Experience the rich flavors of
              Ethiopian cuisine with our intelligent recipe matching.
            </p>

            {/* Ingredient Search Section */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  What ingredients do you have?
                </h3>

                {/* Selected Ingredients */}
                {selectedIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedIngredients.map((ingredient) => (
                      <span
                        key={ingredient.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {ingredient.name}
                        <button
                          onClick={() => removeIngredient(ingredient.id)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search for ingredients (e.g., berbere, injera, lentils)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Ingredient Suggestions */}
                {searchQuery && filteredIngredients.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {filteredIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => addIngredient(ingredient)}
                        className="p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
                      >
                        {ingredient.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Find Recipes Button */}
                {selectedIngredients.length > 0 && (
                  <Link
                    to={`/match?ingredients=${selectedIngredients
                      .map((ing) => ing.id)
                      .join(",")}`}
                    className="inline-flex items-center mt-4 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Find Matching Recipes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/recipes"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse All Recipes
                <BookOpen className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/ingredients"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                Explore Ingredients
                <ChefHat className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              Popular Ethiopian Recipes
            </h2>
            <p className="text-lg text-gray-600">
              Discover the most loved recipes from our community
            </p>
          </div>

          {recipesLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularRecipes?.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
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
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        {recipe.difficulty}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/recipes"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              View All Recipes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
