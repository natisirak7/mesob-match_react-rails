import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useQueryClient } from "react-query";
import { ChefHat, Plus, X, Clock, Users, Star, Upload } from "lucide-react";
import { recipesAPI, ingredientsAPI } from "../services/api";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const CreateRecipe = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      prep_time: "",
      cook_time: "",
      servings: "",
      difficulty: "easy",
      cuisine: "ethiopian",
      recipe_ingredients: [
        { ingredient_id: "", quantity: "", ingredient_name: "", is_new: false },
      ],
      instructions: [{ step_number: 1, description: "" }],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: "recipe_ingredients",
  });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control,
    name: "instructions",
  });

  // Fetch ingredients for selection
  const { data: ingredients, isLoading: ingredientsLoading } = useQuery(
    "ingredients",
    () => ingredientsAPI.getAll(),
    {
      select: (response) => response.data || [],
    }
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setValue("image", file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("🚀 CreateRecipe form submitted:", data);

    try {
      // Process ingredients - create new ones if needed
      const processedIngredients = await Promise.all(
        data.recipe_ingredients.map(async (ingredient) => {
          if (ingredient.is_new === "true" || ingredient.is_new === true) {
            // Create new ingredient
            try {
              const newIngredient = await ingredientsAPI.create({
                name: ingredient.ingredient_name,
                category: ingredient.ingredient_category || "other",
              });
              return {
                ingredient_id: newIngredient.data.id,
                quantity: ingredient.quantity,
              };
            } catch (error) {
              console.error("Error creating ingredient:", error);
              toast.error(
                `Failed to create ingredient: ${ingredient.ingredient_name}`
              );
              throw error;
            }
          } else {
            // Use existing ingredient
            return {
              ingredient_id: ingredient.ingredient_id,
              quantity: ingredient.quantity,
            };
          }
        })
      );

      // Create recipe data
      const recipeData = {
        title: data.title,
        description: data.description,
        prep_time: parseInt(data.prep_time) || 0,
        cook_time: parseInt(data.cook_time) || 0,
        servings: parseInt(data.servings) || 1,
        difficulty: data.difficulty,
        cuisine: data.cuisine || "ethiopian",
        recipe_ingredients: processedIngredients,
        instructions: data.instructions,
      };

      // Handle image upload with FormData
      let submitData;
      if (data.image && data.image instanceof File) {
        console.log("📸 Using FormData for image upload");
        submitData = new FormData();

        // Add image
        submitData.append("image", data.image);

        // Add other fields
        Object.keys(recipeData).forEach((key) => {
          if (key === "recipe_ingredients" || key === "instructions") {
            submitData.append(key, JSON.stringify(recipeData[key]));
          } else {
            submitData.append(key, recipeData[key]);
          }
        });
      } else {
        console.log("📝 Using JSON for submission");
        submitData = recipeData;
      }

      const response = await recipesAPI.create(submitData);
      toast.success("Recipe created successfully!");
      queryClient.invalidateQueries("recipes");
      navigate(`/recipes/${response.data.recipe.id}`);
    } catch (error) {
      console.error("Error creating recipe:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create recipe";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ingredientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Create New Recipe
          </h1>
          <p className="text-gray-600">
            Share your Ethiopian culinary creation with the community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  {...register("title", {
                    required: "Recipe title is required",
                  })}
                  type="text"
                  className="input"
                  placeholder="Enter recipe title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  rows={4}
                  className="input"
                  placeholder="Describe your recipe..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Prep Time (minutes)
                </label>
                <input
                  {...register("prep_time", {
                    required: "Prep time is required",
                  })}
                  type="number"
                  className="input"
                  placeholder="30"
                />
                {errors.prep_time && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.prep_time.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Cook Time (minutes)
                </label>
                <input
                  {...register("cook_time", {
                    required: "Cook time is required",
                  })}
                  type="number"
                  className="input"
                  placeholder="45"
                />
                {errors.cook_time && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.cook_time.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Servings
                </label>
                <input
                  {...register("servings", {
                    required: "Servings is required",
                  })}
                  type="number"
                  className="input"
                  placeholder="4"
                />
                {errors.servings && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.servings.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline h-4 w-4 mr-1" />
                  Difficulty
                </label>
                <select {...register("difficulty")} className="input">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine
                </label>
                <select {...register("cuisine")} className="input">
                  <option value="ethiopian">Ethiopian</option>
                  <option value="italian">Italian</option>
                  <option value="mexican">Mexican</option>
                  <option value="chinese">Chinese</option>
                  <option value="indian">Indian</option>
                  <option value="mediterranean">Mediterranean</option>
                  <option value="american">American</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Recipe preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setValue("image", null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Ingredients
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendIngredient({
                    ingredient_id: "",
                    quantity: "",
                    ingredient_name: "",
                    is_new: false,
                  })
                }
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </button>
            </div>

            <div className="space-y-4">
              {ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-gray-50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`ingredient_type_${index}`}
                        value="existing"
                        defaultChecked
                        className="mr-2 text-primary-600"
                        onChange={() => {
                          setValue(`recipe_ingredients.${index}.is_new`, false);
                          setValue(
                            `recipe_ingredients.${index}.ingredient_name`,
                            ""
                          );
                          setValue(
                            `recipe_ingredients.${index}.ingredient_category`,
                            ""
                          );
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select existing ingredient
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={`ingredient_type_${index}`}
                        value="new"
                        className="mr-2 text-primary-600"
                        onChange={() => {
                          setValue(`recipe_ingredients.${index}.is_new`, true);
                          setValue(
                            `recipe_ingredients.${index}.ingredient_id`,
                            ""
                          );
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Add new ingredient
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      {watch(`recipe_ingredients.${index}.is_new`) ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ingredient Name *
                            </label>
                            <input
                              type="text"
                              {...register(
                                `recipe_ingredients.${index}.ingredient_name`,
                                {
                                  required: "Ingredient name is required",
                                }
                              )}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="e.g., Fresh Berbere Spice"
                            />
                            {errors.recipe_ingredients?.[index]
                              ?.ingredient_name && (
                              <p className="mt-1 text-sm text-red-600">
                                {
                                  errors.recipe_ingredients[index]
                                    .ingredient_name.message
                                }
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <select
                              {...register(
                                `recipe_ingredients.${index}.ingredient_category`
                              )}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="">Select category</option>
                              <option value="spices">
                                Spices & Seasonings
                              </option>
                              <option value="vegetables">Vegetables</option>
                              <option value="meat">Meat & Poultry</option>
                              <option value="grains">Grains & Cereals</option>
                              <option value="legumes">Legumes & Beans</option>
                              <option value="dairy">Dairy Products</option>
                              <option value="oils">Oils & Fats</option>
                              <option value="herbs">Fresh Herbs</option>
                              <option value="fruits">Fruits</option>
                              <option value="nuts">Nuts & Seeds</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Ingredient *
                          </label>
                          <select
                            {...register(
                              `recipe_ingredients.${index}.ingredient_id`,
                              {
                                required: "Please select an ingredient",
                              }
                            )}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">
                              Choose from existing ingredients...
                            </option>
                            {ingredients?.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name} ({ingredient.category})
                              </option>
                            ))}
                          </select>
                          {errors.recipe_ingredients?.[index]
                            ?.ingredient_id && (
                            <p className="mt-1 text-sm text-red-600">
                              {
                                errors.recipe_ingredients[index].ingredient_id
                                  .message
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-40">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="text"
                        {...register(`recipe_ingredients.${index}.quantity`, {
                          required: "Quantity is required",
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="1 cup"
                      />
                      {errors.recipe_ingredients?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.recipe_ingredients[index].quantity.message}
                        </p>
                      )}
                    </div>

                    {ingredientFields.length > 1 && (
                      <div className="pt-6">
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove ingredient"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Instructions
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendInstruction({
                    step_number: instructionFields.length + 1,
                    description: "",
                  })
                }
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <textarea
                      {...register(`instructions.${index}.description`, {
                        required: "Instruction is required",
                      })}
                      rows={3}
                      className="input"
                      placeholder="Describe this step..."
                    />
                  </div>
                  {instructionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Recipe...
                  </>
                ) : (
                  <>
                    <ChefHat className="h-4 w-4 mr-2" />
                    Create Recipe
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
