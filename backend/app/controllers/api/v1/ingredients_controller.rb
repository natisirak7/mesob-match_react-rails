class Api::V1::IngredientsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show, :categorized, :categories, :search, :by_category, :test_auth]
  before_action :authorize_admin_or_author, only: [:create]
  before_action :authorize_admin, only: [:update, :destroy, :create_category, :update_category, :delete_category]
  before_action :set_ingredient, only: [:show, :update, :destroy]

  # GET /api/v1/ingredients
  def index
    @ingredients = Ingredient.all
    
    # Filter by category if provided
    @ingredients = @ingredients.where(category: params[:category]) if params[:category].present?
    
    # Search by name if query provided
    @ingredients = @ingredients.search(params[:q]) if params[:q].present?
    
    render json: @ingredients
  end

  # GET /api/v1/ingredients/categorized
  # Core MesobMatch functionality: Get ingredients grouped by category
  def categorized
    categorized_data = Ingredient.categorized_ingredients
    
    result = {}
    categorized_data.each do |category, ingredients|
      result[category] = ingredients.map do |ingredient|
        {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category
        }
      end
    end
    
    render json: result
  end

  # GET /api/v1/ingredients/categories
  def categories
    render json: { categories: Ingredient::CATEGORIES }
  end

  # GET /api/v1/ingredients/1
  def show
    render json: @ingredient, include: [:recipes]
  end

  # POST /api/v1/ingredients
  def create
    Rails.logger.info "=== INGREDIENT CREATION DEBUG ==="
    Rails.logger.info "Current user: #{current_user&.id} (#{current_user&.role})"
    Rails.logger.info "Raw params: #{params.inspect}"
    Rails.logger.info "Ingredient params: #{ingredient_params.inspect}"
    
    # Use case-insensitive find_or_create_by to gracefully handle existing ingredients
    # First try to find existing ingredient with case-insensitive name match
    existing_ingredient = Ingredient.where('LOWER(name) = ?', ingredient_params[:name].to_s.downcase).first
    
    if existing_ingredient
      Rails.logger.info "Found existing ingredient: #{existing_ingredient.id} - #{existing_ingredient.name}"
      @ingredient = existing_ingredient
    else
      # Create new ingredient if none exists
      Rails.logger.info "Creating new ingredient: #{ingredient_params[:name]}"
      @ingredient = Ingredient.new(ingredient_params)
      @ingredient.save
    end
    
    if @ingredient.persisted?
      action = existing_ingredient ? 'found existing' : 'created'
      status = existing_ingredient ? :ok : :created
      Rails.logger.info "Ingredient #{action}: #{@ingredient.id} - #{@ingredient.name}"
      render json: @ingredient, status: status
    else
      Rails.logger.error "Ingredient creation failed: #{@ingredient.errors.full_messages}"
      render json: { 
        message: 'Failed to create ingredient',
        errors: @ingredient.errors.full_messages,
        debug: {
          name: @ingredient.name,
          category: @ingredient.category,
          valid_categories: Ingredient::CATEGORIES
        }
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/ingredients/1
  def update
    if @ingredient.update(ingredient_params)
      render json: @ingredient
    else
      render json: @ingredient.errors, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/ingredients/1
  def destroy
    @ingredient.destroy
    head :no_content
  end

  # GET /api/v1/ingredients/search
  def search
    query = params[:q]
    if query.present?
      @ingredients = Ingredient.search(query)
      render json: @ingredients
    else
      render json: { error: 'Query parameter required' }, status: :bad_request
    end
  end

  # GET /api/v1/ingredients/by_category/:category
  def by_category
    category = params[:category]
    if Ingredient::CATEGORIES.include?(category)
      @ingredients = Ingredient.where(category: category)
      render json: @ingredients
    else
      render json: { error: 'Invalid category' }, status: :bad_request
    end
  end

  # GET /api/v1/ingredients/test_auth - Debug endpoint
  def test_auth
    render json: {
      message: 'Authentication test',
      current_user: current_user&.as_json(only: [:id, :name, :email, :role]),
      is_admin: current_user&.admin?,
      is_author: current_user&.author?,
      categories: Ingredient::CATEGORIES,
      timestamp: Time.current
    }
  end

  # Admin-only category management endpoints
  
  # POST /api/v1/ingredients/categories
  def create_category
    category_key = params[:key]&.downcase
    category_name = params[:name]
    
    if category_key.blank? || category_name.blank?
      render json: { error: 'Category key and name are required' }, status: :bad_request
      return
    end
    
    # Check if category already exists
    if Ingredient::CATEGORIES.include?(category_key)
      render json: { error: 'Category already exists' }, status: :unprocessable_entity
      return
    end
    
    # Add category to the list (this is a simplified approach)
    # In a production app, you might want to store categories in a separate table
    new_categories = Ingredient::CATEGORIES + [category_key]
    
    # Update the constant (note: this won't persist across server restarts)
    # For production, consider using a database table for categories
    Ingredient.const_set(:CATEGORIES, new_categories.freeze)
    
    render json: { 
      message: 'Category created successfully',
      category: { key: category_key, name: category_name }
    }, status: :created
  end
  
  # PUT /api/v1/ingredients/categories/:id
  def update_category
    old_category = params[:id]
    new_key = params[:key]&.downcase
    new_name = params[:name]
    
    if new_key.blank? || new_name.blank?
      render json: { error: 'Category key and name are required' }, status: :bad_request
      return
    end
    
    unless Ingredient::CATEGORIES.include?(old_category)
      render json: { error: 'Category not found' }, status: :not_found
      return
    end
    
    # Update ingredients that use this category
    Ingredient.where(category: old_category).update_all(category: new_key)
    
    # Update the categories list
    updated_categories = Ingredient::CATEGORIES.map { |cat| cat == old_category ? new_key : cat }
    Ingredient.const_set(:CATEGORIES, updated_categories.freeze)
    
    render json: { 
      message: 'Category updated successfully',
      category: { key: new_key, name: new_name }
    }
  end
  
  # DELETE /api/v1/ingredients/categories/:id
  def delete_category
    category = params[:id]
    
    unless Ingredient::CATEGORIES.include?(category)
      render json: { error: 'Category not found' }, status: :not_found
      return
    end
    
    # Check if any ingredients use this category
    ingredients_count = Ingredient.where(category: category).count
    if ingredients_count > 0
      render json: { 
        error: "Cannot delete category. #{ingredients_count} ingredients are using this category.",
        ingredients_count: ingredients_count
      }, status: :unprocessable_entity
      return
    end
    
    # Remove category from the list
    updated_categories = Ingredient::CATEGORIES.reject { |cat| cat == category }
    Ingredient.const_set(:CATEGORIES, updated_categories.freeze)
    
    render json: { message: 'Category deleted successfully' }
  end

  private

  def set_ingredient
    @ingredient = Ingredient.find(params[:id])
  end

  def ingredient_params
    # Handle both wrapped and unwrapped parameter formats
    if params[:ingredient].present?
      params.require(:ingredient).permit(:name, :category)
    else
      params.permit(:name, :category)
    end
  end

  def authorize_admin
    unless current_user&.admin?
      json_response({ message: 'Unauthorized - Admin access required' }, :unauthorized)
    end
  end

  def authorize_admin_or_author
    Rails.logger.info "=== AUTHORIZATION DEBUG ==="
    Rails.logger.info "Current user: #{current_user&.inspect}"
    Rails.logger.info "User admin?: #{current_user&.admin?}"
    Rails.logger.info "User author?: #{current_user&.author?}"
    Rails.logger.info "User role: #{current_user&.role}"
    
    unless current_user&.admin? || current_user&.author?
      Rails.logger.error "Authorization failed for ingredient creation"
      json_response({ 
        message: 'Unauthorized - Admin or Author access required',
        debug: {
          user_id: current_user&.id,
          user_role: current_user&.role,
          is_admin: current_user&.admin?,
          is_author: current_user&.author?
        }
      }, :unauthorized) and return
    end
    
    Rails.logger.info "Authorization passed for ingredient creation"
  end
end
