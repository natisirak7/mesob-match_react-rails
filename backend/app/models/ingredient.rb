class Ingredient < ApplicationRecord
  has_many :recipe_ingredients, dependent: :destroy
  has_many :recipes, through: :recipe_ingredients

  validates :name, presence: true, uniqueness: true, length: { maximum: 100 }

  # Categories from MesobMatch: Updated to match frontend categories
  CATEGORIES = %w[spices vegetables meat grains legumes dairy oils herbs fruits nuts other].freeze

  validates :category, presence: true, inclusion: { in: CATEGORIES }

  scope :by_category, ->(category) { where(category: category) }
  scope :spices, -> { where(category: 'spices') }
  scope :vegetables, -> { where(category: 'vegetables') }
  scope :meat, -> { where(category: 'meat') }
  scope :grains, -> { where(category: 'grains') }
  scope :legumes, -> { where(category: 'legumes') }
  scope :dairy, -> { where(category: 'dairy') }
  scope :oils, -> { where(category: 'oils') }
  scope :herbs, -> { where(category: 'herbs') }
  scope :fruits, -> { where(category: 'fruits') }
  scope :nuts, -> { where(category: 'nuts') }
  scope :other, -> { where(category: 'other') }

  def self.search(query)
    where("name ILIKE ?", "%#{query}%")
  end

  def self.categorized_ingredients
    {
      spices: spices,
      vegetables: vegetables,
      meat: meat,
      grains: grains,
      legumes: legumes,
      dairy: dairy,
      oils: oils,
      herbs: herbs,
      fruits: fruits,
      nuts: nuts,
      other: other
    }
  end
end
