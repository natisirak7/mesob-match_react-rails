class Api::V1::RecipesController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show, :find_by_ingredients, :makeable, :popular, :categories, :debug_images]
  before_action :set_recipe, only: [:show, :update, :destroy]
  before_action :authorize_admin_or_author, only: [:create]
  before_action :authorize_author_owner_only, only: [:update]
  before_action :authorize_admin_or_owner, only: [:destroy]

  # GET /api/v1/recipes
  def index
    @recipes = Recipe.includes(:ingredients, :instructions, :author)
    
    # Filter by category if provided
    @recipes = @recipes.by_category(params[:category]) if params[:category].present?
    
    recipes_data = @recipes.map do |recipe|
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
        instructions: recipe.instructions.order(:step_number).map { |inst| { step_number: inst.step_number, description: inst.description } },
        image_url: (recipe.image.attached? ? Rails.application.routes.url_helpers.rails_blob_url(recipe.image, only_path: false, host: 'localhost:3000') : nil)
      }
    end
    
    render json: recipes_data
  end

  # GET /api/v1/recipes/1
  def show
    render json: {
      id: @recipe.id,
      name: @recipe.name,
      title: @recipe.title,
      description: @recipe.description,
      category: @recipe.category,
      prep_time: @recipe.prep_time,
      cook_time: @recipe.cook_time,
      servings: @recipe.servings,
      difficulty: @recipe.difficulty,
      cuisine: @recipe.cuisine,
      created_at: @recipe.created_at,
      updated_at: @recipe.updated_at,
      image_url: @recipe.image.attached? ? Rails.application.routes.url_helpers.rails_blob_url(@recipe.image, only_path: false, host: 'localhost:3000') : nil,
      author: @recipe.author ? {
        id: @recipe.author.id,
        name: @recipe.author.name,
        role: @recipe.author.role
      } : nil,
      ingredients: @recipe.ingredients.map do |ingredient|
        recipe_ingredient = @recipe.recipe_ingredients.find_by(ingredient: ingredient)
        {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          quantity: recipe_ingredient&.quantity,
          is_optional: recipe_ingredient&.is_optional
        }
      end,
      instructions: @recipe.instructions.order(:step_number).map do |instruction|
        {
          id: instruction.id,
          step_number: instruction.step_number,
          description: instruction.description
        }
      end
    }
  end

  # POST /api/v1/recipes/find_by_ingredients
  # Core MesobMatch functionality: Find recipes by selected ingredients
  def find_by_ingredients
    ingredient_ids = params[:ingredient_ids]&.map(&:to_i) || []
    match_type = params[:match_type] || 'any' # 'any', 'all', 'exact'
    include_score = params[:include_score] == 'true'

    if ingredient_ids.empty?
      render json: { error: 'No ingredients provided' }, status: :bad_request
      return
    end

    # Find recipes using MesobMatch algorithm
    if include_score
      @recipes = Recipe.ranked_by_ingredients(ingredient_ids)
      recipe_data = @recipes.map do |recipe|
        recipe_json = {
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
          author: recipe.author ? {
            id: recipe.author.id,
            name: recipe.author.name,
            role: recipe.author.role
          } : nil,
          ingredients: recipe.ingredients.map do |ingredient|
            {
              id: ingredient.id,
              name: ingredient.name,
              category: ingredient.category,
              quantity: recipe.recipe_ingredients.find_by(ingredient: ingredient)&.quantity,
              is_optional: recipe.recipe_ingredients.find_by(ingredient: ingredient)&.is_optional
            }
          end,
          instructions: recipe.instructions.order(:step_number).map do |instruction|
            {
              id: instruction.id,
              step_number: instruction.step_number,
              description: instruction.description
            }
          end
        }
        recipe_json['match_score'] = Recipe.match_score(recipe.id, ingredient_ids)
        recipe_json['can_make'] = recipe.can_make_with?(ingredient_ids)
        recipe_json['missing_ingredients'] = recipe.missing_ingredients(ingredient_ids).pluck(:name)
        recipe_json
      end
      render json: recipe_data
    else
      @recipes = Recipe.find_by_ingredients(ingredient_ids, match_type)
                      .includes(:ingredients, :instructions, :author)
      
      Rails.logger.info "=== FIND_BY_INGREDIENTS DEBUG ==="
      Rails.logger.info "Found #{@recipes.count} recipes for ingredient_ids: #{ingredient_ids}"
      @recipes.each do |recipe|
        Rails.logger.info "Recipe: #{recipe.id} - #{recipe.name} - #{recipe.title}"
      end
      Rails.logger.info "=== END DEBUG ==="
      
      render json: @recipes.map { |recipe|
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
          author: recipe.author ? {
            id: recipe.author.id,
            name: recipe.author.name,
            role: recipe.author.role
          } : nil,
          ingredients: recipe.ingredients.map do |ingredient|
            {
              id: ingredient.id,
              name: ingredient.name,
              category: ingredient.category,
              quantity: recipe.recipe_ingredients.find_by(ingredient: ingredient)&.quantity,
              is_optional: recipe.recipe_ingredients.find_by(ingredient: ingredient)&.is_optional
            }
          end,
          instructions: recipe.instructions.order(:step_number).map do |instruction|
            {
              id: instruction.id,
              step_number: instruction.step_number,
              description: instruction.description
            }
          end
        }
      }
    end
  end

  # GET /api/v1/recipes/makeable
  # Find recipes that can be made with available ingredients
  def makeable
    ingredient_ids = params[:ingredient_ids]&.map(&:to_i) || []
    
    if ingredient_ids.empty?
      render json: { error: 'No ingredients provided' }, status: :bad_request
      return
    end

    makeable_recipes = Recipe.includes(:ingredients, :instructions, :author)
                            .select { |recipe| recipe.can_make_with?(ingredient_ids) }

    render json: makeable_recipes, include: [:ingredients, :instructions, :author]
  end

  # POST /api/v1/recipes
  def create
    Rails.logger.info "=== RECIPE CREATION START ==="
    Rails.logger.info "Current user: #{current_user.id} (#{current_user.role})"
    
    begin
      # Parse JSON strings if they come as strings
      recipe_ingredients_data = parse_json_param(params[:recipe_ingredients])
      instructions_data = parse_json_param(params[:instructions])
      
      Rails.logger.info "Parsed recipe_ingredients: #{recipe_ingredients_data.inspect}"
      Rails.logger.info "Parsed instructions: #{instructions_data.inspect}"
      
      @recipe = current_user.recipes.build(recipe_params)
      
      if @recipe.save
        Rails.logger.info "Recipe saved successfully with ID: #{@recipe.id}"
        
        # Handle image upload
        if params[:image].present?
          Rails.logger.info "Attaching image..."
          @recipe.image.attach(params[:image])
        end
        
        # Handle ingredients
        if recipe_ingredients_data.present?
          add_ingredients_to_recipe(@recipe, recipe_ingredients_data)
        end
        
        # Handle instructions
        if instructions_data.present?
          update_recipe_instructions(@recipe, instructions_data)
        end
        
        render json: {
          message: 'Recipe created successfully',
          recipe: {
            id: @recipe.id,
            title: @recipe.title,
            description: @recipe.description,
            prep_time: @recipe.prep_time,
            cook_time: @recipe.cook_time,
            servings: @recipe.servings,
            difficulty: @recipe.difficulty,
            cuisine: @recipe.cuisine,
            created_at: @recipe.created_at,
            updated_at: @recipe.updated_at,
            author: {
              id: @recipe.author.id,
              name: @recipe.author.name,
              email: @recipe.author.email,
              role: @recipe.author.role
            }
          }
        }, status: :created
      else
        Rails.logger.error "Recipe validation failed: #{@recipe.errors.full_messages}"
        render json: { errors: @recipe.errors.full_messages }, status: :unprocessable_entity
      end
    rescue JSON::ParserError => e
      Rails.logger.error "JSON parsing error: #{e.message}"
      render json: { errors: ["Invalid JSON format in recipe data: #{e.message}"] }, status: :bad_request
    rescue => e
      Rails.logger.error "Recipe creation error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { errors: ["Recipe creation failed: #{e.message}"] }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/recipes/1
  def update
    Rails.logger.info "=== RECIPE UPDATE START ==="
    Rails.logger.info "Recipe ID: #{@recipe.id}"
    Rails.logger.info "Raw params: #{params.except(:image).inspect}"
    
    begin
      # Update basic recipe attributes
      if @recipe.update!(recipe_params.except(:image))
        Rails.logger.info "Recipe updated successfully"
        
        # Handle image upload
        if params[:image].present?
          Rails.logger.info "Updating image..."
          @recipe.image.attach(params[:image])
        end
        
        # Handle ingredients
        if params[:recipe_ingredients].present?
          update_recipe_ingredients(@recipe, parse_json_param(params[:recipe_ingredients]))
        end
        
        # Handle instructions
        if params[:instructions].present?
          update_recipe_instructions(@recipe, parse_json_param(params[:instructions]))
        end
        
        render json: {
          message: 'Recipe updated successfully',
          recipe: recipe_with_full_details(@recipe)
        }
      end
    rescue JSON::ParserError => e
      Rails.logger.error "JSON parsing error: #{e.message}"
      render json: { errors: ["Invalid JSON format in recipe data: #{e.message}"] }, status: :bad_request
    rescue => e
      Rails.logger.error "Recipe update error: #{e.message}"
      render json: {
        message: 'Failed to update recipe',
        error: e.message
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/recipes/1
  def destroy
    recipe_title = @recipe.title
    
    begin
      ActiveRecord::Base.transaction do
        # Explicitly delete dependent records first to avoid constraint issues
        @recipe.recipe_ingredients.delete_all
        @recipe.instructions.destroy_all
        
        # Now delete the recipe itself
        @recipe.delete
        
        render json: {
          message: "Recipe '#{recipe_title}' deleted successfully"
        }
      end
    rescue => e
      render json: {
        message: 'Failed to delete recipe',
        error: e.message
      }, status: :internal_server_error
    end
  end

  # GET /api/v1/recipes/categories
  def categories
    categories = Recipe.distinct.pluck(:category).compact.sort
    render json: { categories: categories }
  end

  # GET /api/v1/recipes/popular
  # Returns most popular recipes based on ingredient count
  def popular
    # Fix SQL GROUP BY error by using a subquery approach
    popular_recipe_ids = Recipe.joins(:ingredients)
                              .group('recipes.id')
                              .order('COUNT(ingredients.id) DESC')
                              .limit(10)
                              .pluck(:id)
    
    @recipes = Recipe.where(id: popular_recipe_ids)
                    .includes(:ingredients, :instructions, :author)
                    .order(Arel.sql("CASE recipes.id #{popular_recipe_ids.map.with_index { |id, index| "WHEN #{id} THEN #{index}" }.join(' ')} END"))
    
    render json: @recipes.map { |recipe|
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
        image: recipe.image.attached? ? {
          url: Rails.application.routes.url_helpers.rails_blob_url(recipe.image, only_path: false),
          filename: recipe.image.blob.filename.to_s,
          content_type: recipe.image.blob.content_type,
          byte_size: recipe.image.blob.byte_size
        } : nil,
        author: recipe.author ? {
          id: recipe.author.id,
          name: recipe.author.name,
          role: recipe.author.role
        } : nil,
        ingredients: recipe.ingredients.map { |ingredient|
          recipe_ingredient = recipe.recipe_ingredients.find_by(ingredient: ingredient)
          {
            id: ingredient.id,
            name: ingredient.name,
            category: ingredient.category,
            quantity: recipe_ingredient&.quantity,
            is_optional: recipe_ingredient&.is_optional || false
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
    }
  end

  # Debug endpoint to check Active Storage records
  def debug_images
    Rails.logger.info "=== ACTIVE STORAGE DEBUG ==="
    
    # Check Active Storage tables
    attachments = ActiveStorage::Attachment.all
    Rails.logger.info "Total Active Storage attachments: #{attachments.count}"
    
    attachments.each do |attachment|
      Rails.logger.info "Attachment ID: #{attachment.id}"
      Rails.logger.info "  Record type: #{attachment.record_type}"
      Rails.logger.info "  Record ID: #{attachment.record_id}"
      Rails.logger.info "  Name: #{attachment.name}"
      Rails.logger.info "  Blob ID: #{attachment.blob_id}"
      if attachment.blob
        Rails.logger.info "  Blob key: #{attachment.blob.key}"
        Rails.logger.info "  Blob filename: #{attachment.blob.filename}"
        Rails.logger.info "  Blob content_type: #{attachment.blob.content_type}"
        Rails.logger.info "  Blob byte_size: #{attachment.blob.byte_size}"
      end
    end
    
    # Check recipes with images
    recipes_with_images = Recipe.joins(:image_attachment)
    Rails.logger.info "Recipes with images: #{recipes_with_images.count}"
    
    recipes_with_images.each do |recipe|
      Rails.logger.info "Recipe #{recipe.id} (#{recipe.title}):"
      Rails.logger.info "  Image attached: #{recipe.image.attached?}"
      if recipe.image.attached?
        Rails.logger.info "  Image URL: #{Rails.application.routes.url_helpers.rails_blob_url(recipe.image, only_path: false)}"
        Rails.logger.info "  Image blob key: #{recipe.image.blob.key}"
      end
    end
    
    render json: {
      message: "Debug info logged to Rails console",
      attachments_count: attachments.count,
      recipes_with_images_count: recipes_with_images.count,
      attachments: attachments.map do |att|
        {
          id: att.id,
          record_type: att.record_type,
          record_id: att.record_id,
          name: att.name,
          blob: att.blob ? {
            key: att.blob.key,
            filename: att.blob.filename.to_s,
            content_type: att.blob.content_type,
            byte_size: att.blob.byte_size
          } : nil
        }
      end
    }
  end

  private

  def set_recipe
    @recipe = Recipe.find(params[:id])
  end

  def recipe_params
    # Handle both wrapped and unwrapped parameter formats
    # Also handle FormData which sends parameters at the top level
    if params[:recipe].present?
      params.require(:recipe).permit(:name, :title, :category, :prep_time, :cook_time, :servings, :difficulty, :cuisine, :image, :description)
    else
      # For FormData, parameters come at the top level
      params.permit(:name, :title, :category, :prep_time, :cook_time, :servings, :difficulty, :cuisine, :image, :description)
    end
  end

  def parse_json_param(param)
    return [] if param.blank?
    
    if param.is_a?(String)
      begin
        JSON.parse(param)
      rescue JSON::ParserError => e
        Rails.logger.error "Failed to parse JSON parameter: #{param} - Error: #{e.message}"
        raise JSON::ParserError, "Invalid JSON format in request data: #{e.message}"
      end
    else
      param
    end
  end

  def update_recipe_ingredients(recipe, ingredient_data)
    Rails.logger.info "=== UPDATING RECIPE INGREDIENTS ==="
    Rails.logger.info "Ingredient data: #{ingredient_data.inspect}"
    
    # Extract all ingredient IDs and names for batch queries
    ingredient_ids = ingredient_data.map { |ing| ing[:ingredient_id] || ing['ingredient_id'] }.compact.map(&:to_i)
    ingredient_names = ingredient_data.map { |ing| ing[:name] || ing['name'] }.compact.map(&:downcase)
    
    # Batch load all ingredients by ID and name to avoid N+1 queries
    ingredients_by_id = {}
    ingredients_by_name = {}
    
    if ingredient_ids.any?
      Ingredient.where(id: ingredient_ids).find_each do |ingredient|
        ingredients_by_id[ingredient.id] = ingredient
      end
    end
    
    if ingredient_names.any?
      Ingredient.where('LOWER(name) IN (?)', ingredient_names).find_each do |ingredient|
        ingredients_by_name[ingredient.name.downcase] = ingredient
      end
    end
    
    # Remove existing recipe ingredients that are not present in the new data.
    # Use `delete_all` instead of `destroy_all` because the `recipe_ingredients`
    # table uses a composite primary key (recipe_id, ingredient_id) and has no
    # single-column primary key. `destroy_all` attempts to delete records based
    # on a primary key column, resulting in a malformed SQL statement such as
    # `"recipe_ingredients"."" IS NULL`. Switching to `delete_all` issues a
    # single SQL DELETE with the correct WHERE clause and avoids the
    # PG::SyntaxError encountered during recipe updates.
    recipe.recipe_ingredients.where.not(ingredient_id: ingredient_ids).delete_all
    
    # Process each ingredient with pre-loaded data
    ingredient_data.each do |ingredient_info|
      Rails.logger.info "Processing ingredient: #{ingredient_info.inspect}"
      
      # Handle both string and symbol keys
      ingredient_id = ingredient_info[:ingredient_id] || ingredient_info['ingredient_id']
      ingredient_name = ingredient_info[:name] || ingredient_info['name']
      
      # Use pre-loaded ingredients to avoid N+1 queries
      ingredient = nil
      if ingredient_id.present?
        Rails.logger.info "Using existing ingredient ID: #{ingredient_id}"
        ingredient = ingredients_by_id[ingredient_id.to_i]
        
        # Fallback: If ingredient not in cache (e.g., newly created), query database directly
        unless ingredient
          Rails.logger.info "Ingredient #{ingredient_id} not in cache, querying database directly"
          ingredient = Ingredient.find_by(id: ingredient_id.to_i)
          if ingredient
            Rails.logger.info "Found ingredient in database: #{ingredient.name}"
            # Add to cache for future use
            ingredients_by_id[ingredient.id] = ingredient
          end
        end
      elsif ingredient_name.present?
        Rails.logger.info "Looking up ingredient by name: #{ingredient_name}"
        ingredient = ingredients_by_name[ingredient_name.downcase]
        
        unless ingredient
          Rails.logger.info "Creating new ingredient: #{ingredient_name}"
          ingredient = Ingredient.create!(
            name: ingredient_name,
            category: ingredient_info[:category] || ingredient_info['category'] || 'other'
          )
          Rails.logger.info "New ingredient created: #{ingredient.id} - #{ingredient.name}"
          # Add to cache for future use
          ingredients_by_id[ingredient.id] = ingredient
          ingredients_by_name[ingredient.name.downcase] = ingredient
        end
      else
        Rails.logger.error "No ingredient_id or name provided: #{ingredient_info.inspect}"
        next
      end
      
      unless ingredient
        Rails.logger.error "Could not find or create ingredient: #{ingredient_info.inspect}"
        next
      end
      
      # Handle composite key table - find existing or create new
      recipe_ingredient = recipe.recipe_ingredients.find_by(ingredient: ingredient)
      if recipe_ingredient
        # Use sanitized SQL to update existing record to avoid primary key issues
        quantity = ingredient_info[:quantity] || ingredient_info['quantity']
        is_optional = ingredient_info[:is_optional] || ingredient_info['is_optional'] || false
        
        ActiveRecord::Base.connection.execute(
          ActiveRecord::Base.sanitize_sql_array([
            "UPDATE recipe_ingredients SET quantity = ?, is_optional = ?, updated_at = ? WHERE recipe_id = ? AND ingredient_id = ?",
            quantity, is_optional, Time.current, recipe.id, ingredient.id
          ])
        )
      else
        # Create new record
        recipe.recipe_ingredients.create!(
          ingredient: ingredient,
          quantity: ingredient_info[:quantity] || ingredient_info['quantity'],
          is_optional: ingredient_info[:is_optional] || ingredient_info['is_optional'] || false
        )
      end
      Rails.logger.info "Recipe ingredient updated successfully"
    end
    
    Rails.logger.info "All ingredients updated for recipe successfully"
  end

  def add_ingredients_to_recipe(recipe, ingredient_data)
    Rails.logger.info "=== ADDING INGREDIENTS TO RECIPE ==="
    Rails.logger.info "Ingredient data: #{ingredient_data.inspect}"
    
    ingredient_data.each do |ingredient_info|
      Rails.logger.info "Processing ingredient: #{ingredient_info.inspect}"
      
      # Handle both string and symbol keys
      ingredient_id = ingredient_info[:ingredient_id] || ingredient_info['ingredient_id']
      ingredient_name = ingredient_info[:name] || ingredient_info['name']
      
      # Handle both ingredient_id and name-based lookup
      if ingredient_id.present?
        Rails.logger.info "Using existing ingredient ID: #{ingredient_id}"
        ingredient = Ingredient.find(ingredient_id)
      elsif ingredient_name.present?
        Rails.logger.info "Creating/finding ingredient by name: #{ingredient_name}"
        # Use case-insensitive ingredient lookup
        existing_ingredient = Ingredient.where('LOWER(name) = ?', ingredient_name.to_s.downcase).first
        
        if existing_ingredient
          Rails.logger.info "Found existing ingredient: #{existing_ingredient.id} - #{existing_ingredient.name}"
          ingredient = existing_ingredient
        else
          Rails.logger.info "Creating new ingredient: #{ingredient_name}"
          ingredient = Ingredient.new(
            name: ingredient_name,
            category: ingredient_info[:category] || ingredient_info['category'] || 'other'
          )
          ingredient.save!
          Rails.logger.info "New ingredient created: #{ingredient.id} - #{ingredient.name}"
        end
      else
        Rails.logger.error "No ingredient_id or name provided: #{ingredient_info.inspect}"
        next
      end
      
      Rails.logger.info "Creating recipe ingredient relationship..."
      recipe.recipe_ingredients.create!(
        ingredient: ingredient,
        quantity: ingredient_info[:quantity] || ingredient_info['quantity'],
        is_optional: ingredient_info[:is_optional] || ingredient_info['is_optional'] || false
      )
      Rails.logger.info "Recipe ingredient created successfully"
    end
    
    Rails.logger.info "All ingredients added to recipe successfully"
  end

  def update_recipe_instructions(recipe, instructions)
    Rails.logger.info "=== UPDATING RECIPE INSTRUCTIONS ==="
    Rails.logger.info "Instructions data: #{instructions.inspect}"
    
    # Get step numbers from the new instructions
    new_step_numbers = instructions.map do |instruction_data|
      if instruction_data.is_a?(String)
        instructions.index(instruction_data) + 1
      else
        instruction_data[:step_number] || instruction_data['step_number']
      end
    end.compact
    
    # Remove existing instructions that are not present in the new data
    recipe.instructions.where.not(step_number: new_step_numbers).destroy_all
    
    instructions.each do |instruction_data|
      # Handle both string format (legacy) and object format (current frontend)
      if instruction_data.is_a?(String)
        # Legacy format: array of strings
        step_number = instructions.index(instruction_data) + 1
        description = instruction_data
      else
        # Current format: array of objects with step_number and description
        step_number = instruction_data[:step_number] || instruction_data['step_number']
        description = instruction_data[:description] || instruction_data['description']
      end
      
      # Find existing instruction or create new one
      instruction = recipe.instructions.find_by(step_number: step_number)
      if instruction
        # Update existing instruction
        instruction.update!(description: description)
      else
        # Create new instruction
        recipe.instructions.create!(
          step_number: step_number,
          description: description
        )
      end
      Rails.logger.info "Recipe instruction updated successfully"
    end
    
    Rails.logger.info "All instructions updated for recipe successfully"
  end

  def authorize_admin_or_author
    unless current_user&.admin? || current_user&.author?
      json_response({ message: 'Unauthorized' }, :unauthorized) and return
    end
  end

  # Only the recipe's creator (author) can update it; role doesn't matter
  def authorize_author_owner_only
    unless @recipe.author == current_user
      json_response({ message: 'Unauthorized - Only the recipe creator can update this recipe' }, :unauthorized) and return
    end
  end

  # Admin can delete any recipe, authors can only delete their own
  def authorize_admin_or_owner
    unless current_user&.admin? || (@recipe.author == current_user && current_user&.author?)
      json_response({ message: 'Unauthorized - You can only delete your own recipes' }, :unauthorized) and return
    end
  end

  def recipe_with_full_details(recipe)
    # Safe image URL generation with error handling
    image_url = nil
    if recipe.image.attached?
      begin
        image_url = Rails.application.routes.url_helpers.rails_blob_url(recipe.image, only_path: false, host: 'localhost:3000')
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
      ingredients: recipe.ingredients.map do |ingredient|
        {
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          quantity: recipe.recipe_ingredients.find_by(ingredient: ingredient)&.quantity
        }
      end,
      instructions: recipe.instructions.order(:step_number).map do |instruction|
        {
          id: instruction.id,
          step_number: instruction.step_number,
          description: instruction.description
        }
      end
    }
  end
end
