class Recipe < ApplicationRecord
  belongs_to :author, class_name: 'User'
  has_many :recipe_ingredients, dependent: :destroy
  has_many :ingredients, through: :recipe_ingredients
  has_many :instructions, -> { order(:step_number) }, dependent: :destroy
  
  # Image attachment support
  has_one_attached :image
  
  # Image validation
  validate :acceptable_image
  


  validates :title, presence: true, length: { maximum: 255 }
  validates :category, length: { maximum: 50 }
  validates :cook_time, length: { maximum: 50 }
  validates :servings, numericality: { greater_than: 0 }, allow_blank: true

  scope :by_category, ->(category) { where(category: category) }
  scope :with_ingredients, -> { joins(:ingredients).distinct }

  # Core MesobMatch functionality: Find recipes by ingredients
  def self.find_by_ingredients(ingredient_ids, match_type = 'any')
    return none if ingredient_ids.blank?

    case match_type
    when 'all'
      # Must have ALL selected ingredients
      recipes_with_all_ingredients(ingredient_ids)
    when 'any'
      # Must have ANY of the selected ingredients
      recipes_with_any_ingredients(ingredient_ids)
    when 'exact'
      # Must have EXACTLY the selected ingredients (no more, no less)
      recipes_with_exact_ingredients(ingredient_ids)
    else
      recipes_with_any_ingredients(ingredient_ids)
    end
  end

  # MesobMatch ingredient matching algorithm
  def self.match_score(recipe_id, selected_ingredient_ids)
    recipe = find(recipe_id)
    recipe_ingredient_ids = recipe.ingredients.pluck(:id)
    
    # Calculate match percentage
    matching_ingredients = (recipe_ingredient_ids & selected_ingredient_ids).size
    total_recipe_ingredients = recipe_ingredient_ids.size
    
    return 0 if total_recipe_ingredients == 0
    
    (matching_ingredients.to_f / total_recipe_ingredients * 100).round(2)
  end

  # Get recipes sorted by ingredient match score
  def self.ranked_by_ingredients(ingredient_ids)
    return none if ingredient_ids.blank?

    recipe_ids = joins(:recipe_ingredients)
                .where(recipe_ingredients: { ingredient_id: ingredient_ids })
                .distinct
                .pluck(:id)

    recipes_with_scores = recipe_ids.map do |recipe_id|
      score = match_score(recipe_id, ingredient_ids)
      [recipe_id, score]
    end

    # Sort by score descending
    sorted_recipe_ids = recipes_with_scores
                       .sort_by { |_, score| -score }
                       .map { |recipe_id, _| recipe_id }

    where(id: sorted_recipe_ids)
      .order(Arel.sql("CASE #{sorted_recipe_ids.map.with_index { |id, i| "WHEN id = #{id} THEN #{i}" }.join(' ')} END"))
  end

  # Check if recipe can be made with available ingredients
  def can_make_with?(available_ingredient_ids)
    required_ingredients = recipe_ingredients.where(is_optional: false).includes(:ingredient)
    required_ingredient_ids = required_ingredients.pluck(:ingredient_id)
    
    (required_ingredient_ids - available_ingredient_ids).empty?
  end

  # Get missing ingredients for a recipe
  def missing_ingredients(available_ingredient_ids)
    required_ingredient_ids = recipe_ingredients.where(is_optional: false).pluck(:ingredient_id)
    missing_ids = required_ingredient_ids - available_ingredient_ids
    Ingredient.where(id: missing_ids)
  end

  # Get optional ingredients that are available
  def available_optional_ingredients(available_ingredient_ids)
    optional_ingredient_ids = recipe_ingredients.where(is_optional: true).pluck(:ingredient_id)
    available_optional_ids = optional_ingredient_ids & available_ingredient_ids
    Ingredient.where(id: available_optional_ids)
  end

  def ingredient_categories
    ingredients.group(:category).count
  end

  def required_ingredients
    ingredients.joins(:recipe_ingredients).where(recipe_ingredients: { is_optional: false })
  end

  def optional_ingredients
    ingredients.joins(:recipe_ingredients).where(recipe_ingredients: { is_optional: true })
  end

  private

  def self.recipes_with_all_ingredients(ingredient_ids)
    joins(:recipe_ingredients)
      .where(recipe_ingredients: { ingredient_id: ingredient_ids })
      .group('recipes.id')
      .having('COUNT(DISTINCT recipe_ingredients.ingredient_id) = ?', ingredient_ids.size)
  end

  def self.recipes_with_any_ingredients(ingredient_ids)
    joins(:recipe_ingredients)
      .where(recipe_ingredients: { ingredient_id: ingredient_ids })
      .distinct
  end

  def self.recipes_with_exact_ingredients(ingredient_ids)
    # Recipes that have exactly these ingredients and no others
    recipe_ids_with_all = recipes_with_all_ingredients(ingredient_ids).pluck(:id)
    
    where(id: recipe_ids_with_all)
      .joins(:recipe_ingredients)
      .group('recipes.id')
      .having('COUNT(recipe_ingredients.ingredient_id) = ?', ingredient_ids.size)
  end

  private

  def cleanup_associations
    # Explicitly delete recipe_ingredients first to avoid constraint issues
    RecipeIngredient.where(recipe_id: id).delete_all
    # Instructions will be handled by dependent: :destroy
  end

  def acceptable_image
    return unless image.attached?

    # Allow larger images (up to 15 MB). This keeps uploads flexible while still
    # guarding against excessively large files that could strain storage or
    # bandwidth.
    unless image.blob.byte_size <= 15.megabytes
      max_mb = 15
      errors.add(:image, "is too big (should be at most #{max_mb}MB)")
    end

    acceptable_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    unless acceptable_types.include?(image.blob.content_type)
      errors.add(:image, 'must be a JPEG, PNG, GIF, or WebP')
    end
  end
end
