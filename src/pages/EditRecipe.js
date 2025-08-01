import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useQueryClient } from "react-query";
import { recipesAPI, ingredientsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import toast from "react-hot-toast";
import { ChefHat, Clock, Users, Star, Plus, Minus, Upload } from "lucide-react";

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { loading, isAuthenticated } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [formReady, setFormReady] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
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
        {
          ingredient_id: "",
          quantity: "",
          ingredient_name: "",
          is_new: false,
          ingredient_category: "",
        },
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
    keyName: "fieldId", // Add unique key
  });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control,
    name: "instructions",
    keyName: "fieldId", // Add unique key
  });

  // Fetch recipe and ingredients data in parallel for better performance
  const {
    data: recipeData,
    isLoading: recipeLoading,
    error: recipeError,
  } = useQuery(
    ["recipe-with-ingredients", id],
    () => recipesAPI.getByIdWithIngredients(id),
    {
      enabled: !loading && isAuthenticated,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      onSuccess: (data) => {
        console.log("✅ EditRecipe: Recipe and ingredients data loaded:", data);
        
        const recipeInfo = data.recipe;
        
        // Create form data object
        const formData = {
          title: recipeInfo.title || "",
          description: recipeInfo.description || "",
          prep_time: recipeInfo.prep_time || "",
          cook_time: recipeInfo.cook_time || "",
          servings: recipeInfo.servings || "",
          difficulty: recipeInfo.difficulty || "easy",
          cuisine: recipeInfo.cuisine || "ethiopian",
          recipe_ingredients: [],
          instructions: [],
        };

        // Handle recipe ingredients
        if (recipeInfo.recipe_ingredients && Array.isArray(recipeInfo.recipe_ingredients)) {
          console.log(
            "🥕 Processing recipe ingredients:",
            recipeInfo.recipe_ingredients
          );
          formData.recipe_ingredients = recipeInfo.recipe_ingredients.map((ri) => ({
            ingredient_id: ri.ingredient?.id || ri.ingredient_id || "",
            quantity: ri.quantity || "",
            ingredient_name: ri.ingredient?.name || ri.ingredient_name || "",
            is_new: false,
            ingredient_category: ri.ingredient?.category || "",
          }));
        }

        // Ensure at least one ingredient field
        if (formData.recipe_ingredients.length === 0) {
          formData.recipe_ingredients = [
            {
              ingredient_id: "",
              quantity: "",
              ingredient_name: "",
              is_new: false,
              ingredient_category: "",
            },
          ];
        }

        // Handle instructions
        if (recipeInfo.instructions && Array.isArray(recipeInfo.instructions)) {
          console.log("📝 Processing instructions:", recipeInfo.instructions);
          formData.instructions = recipeInfo.instructions
            .sort((a, b) => (a.step_number || 0) - (b.step_number || 0))
            .map((inst, index) => ({
              step_number: inst.step_number || index + 1,
              description: inst.description || "",
            }));
        }

        // Ensure at least one instruction field
        if (formData.instructions.length === 0) {
          formData.instructions = [{ step_number: 1, description: "" }];
        }

        console.log("✅ EditRecipe: Final form data:", formData);

        // Reset form with new data
        reset(formData);

        // Set formReady to true
        setFormReady(true);

        // Set image preview if recipe has an image
        if (recipeInfo.image_url || recipeInfo.image?.url) {
          const imageUrl = recipeInfo.image_url || recipeInfo.image?.url;
          console.log("🖼️ Setting image preview:", imageUrl);
          setImagePreview(imageUrl);
        }
      },
      onError: (error) => {
        console.error("❌ Failed to load recipe and ingredients:", error);
        toast.error("Failed to load recipe data");
      },
    }
  );

  // Extract recipe and ingredients from the combined data
  const recipe = recipeData?.recipe;
  const ingredients = recipeData?.ingredients || [];
  const ingredientsLoading = recipeLoading; // Same loading state since fetched together

  // Image change handler
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

  // Form submission handler
  const onSubmit = async (data) => {
    console.log("🚀 EditRecipe form submitted:", data);

    try {
      // Process ingredients (create new ones if needed)
      const processedIngredients = await Promise.all(
        data.recipe_ingredients.map(async (ingredient) => {
          if (ingredient.is_new === "true" || ingredient.is_new === true) {
            try {
              const newIngredientResponse = await ingredientsAPI.create({
                name: ingredient.ingredient_name,
                category: ingredient.ingredient_category || "other",
              });
              return {
                ingredient_id: newIngredientResponse.data.id,
                quantity: ingredient.quantity,
              };
            } catch (error) {
              console.error("❌ Failed to create ingredient:", error);
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

      // Update recipe with processed ingredients
      const recipeData = {
        ...data,
        recipe_ingredients: processedIngredients,
      };

      // Convert to FormData if image is present for proper file upload
      let submitData;
      if (data.image && data.image instanceof File) {
        console.log("📸 Image detected, using FormData for submission");
        submitData = new FormData();

        // Add all recipe fields to FormData
        Object.keys(recipeData).forEach((key) => {
          if (key === "image") {
            submitData.append("image", data.image);
          } else if (key === "recipe_ingredients") {
            submitData.append(
              "recipe_ingredients",
              JSON.stringify(recipeData.recipe_ingredients)
            );
          } else if (key === "instructions") {
            submitData.append(
              "instructions",
              JSON.stringify(recipeData.instructions)
            );
          } else {
            submitData.append(key, recipeData[key]);
          }
        });
      } else {
        console.log("📝 No image, using regular JSON submission");
        submitData = recipeData;
      }

      console.log("🚀 About to send request to backend...");
      const response = await recipesAPI.update(id, submitData);
      toast.success("Recipe updated successfully!");
      queryClient.invalidateQueries(["recipe", id]);
      queryClient.invalidateQueries(["recipes"]);
      navigate(`/recipes/${response.data.id}`);
    } catch (error) {
      console.error("❌ Form submission error:", error);

      // Handle different types of errors
      let errorMessage = "Failed to update recipe";

      if (error.response?.data?.errors) {
        // Backend validation errors (array)
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(", ");
        } else {
          errorMessage = error.response.data.errors;
        }
      } else if (error.response?.data?.message) {
        // Backend message errors
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        // Authentication errors
        errorMessage =
          "You are not authorized to update this recipe. Please check if you are the recipe author.";
      } else if (error.response?.status === 422) {
        // Validation errors
        errorMessage =
          "Recipe data validation failed. Please check your inputs.";
      } else if (error.response?.status === 400) {
        // Bad request (likely JSON parsing errors)
        errorMessage =
          error.response?.data?.errors?.[0] ||
          "Invalid data format. Please try again.";
      } else if (error.message) {
        // Network or other errors
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  // Loading state
  if (recipeLoading || ingredientsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (recipeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Recipe
          </h2>
          <p className="text-gray-600 mb-4">Failed to load recipe data</p>
          <button
            onClick={() => navigate("/recipes")}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Recipes
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Recipe not found
          </h3>
          <p className="text-gray-600">
            The recipe you're looking for doesn't exist or you don't have
            permission to edit it.
          </p>
        </div>
      </div>
    );
  }

  // Don't render form until data is loaded and form is ready
  if (!formReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">
          Edit Recipe
        </h1>

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
                  type="text"
                  {...register("title", {
                    required: "Recipe title is required",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe your recipe..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  {...register("prep_time", { min: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  {...register("cook_time", { min: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  {...register("servings", { min: 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="inline h-4 w-4 mr-1" />
                  Difficulty
                </label>
                <select
                  {...register("difficulty")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine
                </label>
                <select
                  {...register("cuisine")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ethiopian">Ethiopian</option>
                  <option value="italian">Italian</option>
                  <option value="mexican">Mexican</option>
                  <option value="indian">Indian</option>
                  <option value="chinese">Chinese</option>
                  <option value="american">American</option>
                  <option value="french">French</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recipe Image
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Recipe preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or JPEG (MAX. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setValue("image", null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove image
                </button>
              )}
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
                    ingredient_category: "",
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
                            {ingredients.map((ingredient) => (
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
                          <Minus className="h-5 w-5" />
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
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {instructionFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mt-2">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <textarea
                      {...register(`instructions.${index}.description`, {
                        required: "Instruction description is required",
                      })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={`Describe step ${index + 1}...`}
                    />
                    {errors.instructions?.[index]?.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.instructions[index].description.message}
                      </p>
                    )}
                  </div>

                  {instructionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="mt-3 p-2 text-red-600 hover:text-red-800"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Update Recipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
