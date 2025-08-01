class RecipeIngredient < ApplicationRecord
  belongs_to :recipe
  belongs_to :ingredient

  validates :recipe_id, uniqueness: { scope: :ingredient_id }
  validates :is_optional, inclusion: { in: [true, false] }

  scope :required, -> { where(is_optional: false) }
  scope :optional, -> { where(is_optional: true) }

  def required?
    !is_optional
  end

  def optional?
    is_optional
  end
end
