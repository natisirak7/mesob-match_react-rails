import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { Clock, Users, ChefHat, ArrowLeft, Trash2 } from "lucide-react";
import { recipesAPI } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery(["recipe", id], () => recipesAPI.getById(id), {
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recipe not found
          </h3>
          <p className="text-gray-600 mb-6">
            The recipe you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/recipes" className="btn btn-primary">
            Browse Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/recipes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recipes
        </Link>

        {/* Recipe Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
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
              <ChefHat className="h-20 w-20 text-primary-400" />
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                  {recipe.title}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  {recipe.description}
                </p>
                <p className="text-sm text-gray-500">
                  By {recipe.author?.name} • {recipe.cuisine} cuisine
                </p>
              </div>
              {/* Delete button visible only to admins */}
              {isAdmin() && (
                <button
                  onClick={async () => {
                    if (
                      !window.confirm(`Delete "${recipe.title}" permanently?`)
                    )
                      return;
                    try {
                      await recipesAPI.delete(recipe.id);
                      alert("Recipe deleted");
                      navigate("/recipes");
                    } catch (err) {
                      const msg =
                        err.response?.data?.message || "Delete failed";
                      alert(msg);
                    }
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Delete recipe"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Recipe Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Prep: {recipe.prep_time || 0} min
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Cook: {recipe.cook_time || 0} min
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Serves {recipe.servings}
              </div>
              <div className="capitalize">Difficulty: {recipe.difficulty}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ingredients
              </h2>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-primary-400 rounded-full mr-3"></span>
                      {ingredient.quantity && (
                        <span className="font-medium mr-2">
                          {ingredient.quantity}
                        </span>
                      )}
                      {ingredient.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No ingredients listed.</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Instructions
              </h2>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                        {instruction.step_number || index + 1}
                      </span>
                      <p className="text-gray-700 pt-1">
                        {instruction.description}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500">No instructions provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
