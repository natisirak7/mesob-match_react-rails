class Api::V1::DashboardController < ApplicationController
  before_action :authenticate_request

  # GET /api/v1/dashboard
  # Returns role-based recipe listing
  def index
    if current_user.admin?
      # Admin sees all recipes with author information
      recipes = Recipe.includes(:author, :ingredients, :instructions)
                      .order(created_at: :desc)
    else
      # Authors see only their own recipes
      recipes = current_user.recipes.includes(:ingredients, :instructions)
                            .order(created_at: :desc)
    end

    render json: {
      user: user_info(current_user),
      recipes: recipes.map { |recipe| recipe_with_details(recipe) },
      total_recipes: recipes.count,
      user_role: current_user.role
    }
  end

  # GET /api/v1/dashboard/stats
  # Returns dashboard statistics
  def stats
    if current_user.admin?
      # Admin stats: all system data
      stats = {
        total_recipes: Recipe.count,
        total_users: User.count,
        total_ingredients: Ingredient.count,
        recent_recipes: Recipe.order(created_at: :desc).limit(5).pluck(:title, :created_at),
        recipes_by_category: Recipe.group(:category).count,
        users_by_role: User.group(:role).count
      }
    else
      # Author stats: provide consistent structure with admin but show relevant data
      user_recipes = current_user.recipes
      stats = {
        total_recipes: user_recipes.count,  # Show user's recipe count as "total recipes"
        total_ingredients: Ingredient.count,  # Show all ingredients available
        total_users: 1,  # Just show 1 for the current user
        my_recipes: user_recipes.count,
        my_recent_recipes: user_recipes.order(created_at: :desc).limit(5).pluck(:title, :created_at),
        my_recipes_by_category: user_recipes.group(:category).count,
        total_ingredients_used: user_recipes.joins(:ingredients).distinct.count('ingredients.id')
      }
    end

    render json: stats
  end

  # GET /api/v1/dashboard/my_recipes
  # Returns current user's recipes (for authors)
  def my_recipes
    Rails.logger.info "=== DASHBOARD MY_RECIPES DEBUG ==="
    Rails.logger.info "Current user: #{current_user&.id} (#{current_user&.role})"
    
    begin
      recipes = current_user.recipes.includes(:ingredients, :instructions, :author, :recipe_ingredients, image_attachment: :blob)
                            .order(created_at: :desc)
      
      Rails.logger.info "Found #{recipes.count} recipes for user #{current_user.id}"
      
      recipes_data = recipes.map do |recipe|
        recipe_data = recipe_with_details(recipe)
        Rails.logger.info "Recipe #{recipe.id}: #{recipe_data.keys.join(', ')}"
        recipe_data
      end
      
      Rails.logger.info "Returning #{recipes_data.count} recipes with details"

      render json: {
        recipes: recipes_data,
        total: recipes.count
      }
    rescue => e
      Rails.logger.error "Error in my_recipes: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { 
        error: 'Failed to fetch recipes',
        recipes: [],
        total: 0
      }, status: :internal_server_error
    end
  end

  # GET /api/v1/dashboard/all_recipes
  # Returns all recipes (admin only)
  def all_recipes
    return unless authorize_admin

    recipes = Recipe.includes(:author, :ingredients, :instructions)
                    .order(created_at: :desc)

    recipes_data = recipes.map do |recipe|
      {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        author: {
          id: recipe.author.id,
          name: recipe.author.name,
          email: recipe.author.email,
          role: recipe.author.role
        },
        ingredients: recipe.ingredients.map { |ing| { id: ing.id, name: ing.name, category: ing.category } },
        instructions: recipe.instructions.order(:step_number).map { |inst| { step_number: inst.step_number, description: inst.description } }
      }
    end

    render json: {
      recipes: recipes_data,
      total: recipes.count
    }
  end

  private

  def user_info(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  end

  def recipe_with_details(recipe)
    # Pre-load recipe_ingredients to avoid N+1 queries
    recipe_ingredients_by_ingredient_id = recipe.recipe_ingredients.index_by(&:ingredient_id)
    
    # Safe image URL generation with error handling
    image_url = nil
    if recipe.image.attached?
      begin
        image_url = safe_image_url(recipe.image)
      rescue => e
        Rails.logger.error "Failed to generate image URL for recipe #{recipe.id}: #{e.message}"
        image_url = nil
      end
    end

    {
      id: recipe.id,
      name: recipe.name,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      image_url: image_url,
      image: image_url,
      author: {
        id: recipe.author.id,
        name: recipe.author.name,
        email: recipe.author.email,
        role: recipe.author.role
      },
      ingredients_count: recipe.ingredients.size,
      instructions_count: recipe.instructions.size,
      ingredients: recipe.ingredients.map { |ingredient|
        recipe_ingredient = recipe_ingredients_by_ingredient_id[ingredient.id]
        {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          quantity: recipe_ingredient&.quantity,
          is_optional: recipe_ingredient&.is_optional
        }
      },
      instructions: recipe.instructions.order(:step_number).map { |instruction|
        {
          id: instruction.id,
          step_number: instruction.step_number,
          description: instruction.description
        }
      }
    }
  end

  def safe_image_url(image)
    return nil unless image.attached?
    
    begin
      # Try using rails_blob_url first with proper host
      Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false, host: 'localhost:3000')
    rescue => e
      # Fallback to url_for with explicit host
      Rails.application.routes.url_helpers.url_for(
        image, 
        only_path: false, 
        host: 'localhost:3000'
      )
    end
  rescue => e
    # If all else fails, return nil
    Rails.logger.error "Failed to generate image URL: #{e.message}"
    nil
  end

  def authorize_admin
    unless current_user&.admin?
      json_response({ message: 'Unauthorized - Admin access required' }, :unauthorized)
      return false
    end
    true
  end
end
