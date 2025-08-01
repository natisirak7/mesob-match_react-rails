import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, ChefHat, Clock, Sparkles } from 'lucide-react';
import { recipesAPI, ingredientsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const RecipeMatch = () => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedRecipes, setMatchedRecipes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: ingredients } = useQuery(
    'ingredients',
    () => ingredientsAPI.getAll(),
    { select: (response) => response.data }
  );

  const filteredIngredients = ingredients?.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedIngredients.find(selected => selected.id === ingredient.id)
  ).slice(0, 12) || [];

  // Show popular ingredients when no search query
  const popularIngredients = ingredients?.filter(ingredient =>
    !selectedIngredients.find(selected => selected.id === ingredient.id)
  ).slice(0, 16) || [];

  const addIngredient = (ingredient) => {
    setSelectedIngredients([...selectedIngredients, ingredient]);
    setSearchQuery('');
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(ing => ing.id !== ingredientId));
  };

  const searchRecipes = async () => {
    if (selectedIngredients.length === 0) return;
    
    setIsSearching(true);
    try {
      const response = await recipesAPI.findByIngredients(
        selectedIngredients.map(ing => ing.id)
      );
      setMatchedRecipes(response.data);
    } catch (error) {
      console.error('Error searching recipes:', error);
      setMatchedRecipes([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Recipe Match
          </h1>
          <p className="text-lg text-gray-600">
            Find Ethiopian recipes based on your ingredients
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Ingredients
              </h2>

              {/* Selected Ingredients */}
              {selectedIngredients.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
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
                </div>
              )}

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>

              {/* Ingredient Suggestions */}
              {searchQuery && filteredIngredients.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => addIngredient(ingredient)}
                        className="text-left p-2 text-sm bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors border border-transparent hover:border-primary-200"
                      >
                        {ingredient.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !searchQuery && popularIngredients.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Popular Ingredients</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {popularIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => addIngredient(ingredient)}
                        className="text-left p-2 text-sm bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-lg transition-colors border border-transparent hover:border-primary-200"
                      >
                        {ingredient.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={searchRecipes}
                disabled={selectedIngredients.length === 0 || isSearching}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {isSearching ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find Recipes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {selectedIngredients.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select ingredients to get started
                </h3>
                <p className="text-gray-600">
                  Choose ingredients to find matching Ethiopian recipes.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recipe Matches ({matchedRecipes.length})
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  {matchedRecipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      to={`/recipes/${recipe.id}`}
                      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {recipe.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {recipe.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeMatch;
