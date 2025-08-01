import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, ChefHat, Filter } from 'lucide-react';
import { ingredientsAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Ingredients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: ingredients, isLoading, error } = useQuery(
    ['ingredients', selectedCategory],
    () => selectedCategory 
      ? ingredientsAPI.getByCategory(selectedCategory)
      : ingredientsAPI.getAll(),
    {
      select: (response) => response.data,
      staleTime: 10 * 60 * 1000,
    }
  );

  const { data: categories } = useQuery(
    'ingredientCategories',
    () => ingredientsAPI.getCategories(),
    {
      select: (response) => response.data.categories,
      staleTime: 15 * 60 * 1000,
    }
  );

  const filteredIngredients = ingredients?.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedIngredients = filteredIngredients.reduce((groups, ingredient) => {
    const category = ingredient.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(ingredient);
    return groups;
  }, {});

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load ingredients
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
            Ethiopian Ingredients
          </h1>
          <p className="text-lg text-gray-600">
            Explore the rich variety of ingredients used in Ethiopian cuisine
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="">All Categories</option>
                {categories?.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!isLoading && filteredIngredients.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No ingredients found
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters.'
                : 'No ingredients available.'}
            </p>
          </div>
        )}

        {!isLoading && Object.keys(groupedIngredients).length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedIngredients).map(([category, categoryIngredients]) => (
              <div key={category} className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {category} ({categoryIngredients.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {categoryIngredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <ChefHat className="h-6 w-6 text-primary-600" />
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {ingredient.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ingredients;
