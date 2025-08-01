# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
# Clear existing data
puts "Clearing existing data..."
RecipeIngredient.destroy_all
Instruction.destroy_all
Recipe.destroy_all
Ingredient.destroy_all
User.destroy_all

puts "Creating users..."
# Create users
admin = User.create!(
  name: "Admin User",
  email: "admin@mesobmatch.com",
  password: "password123",
  role: :admin
)

author1 = User.create!(
  name: "Almaz Tadesse",
  email: "almaz@mesobmatch.com",
  password: "password123",
  role: :author
)

author2 = User.create!(
  name: "Kebede Mulugeta",
  email: "kebede@mesobmatch.com",
  password: "password123",
  role: :author
)

puts "Creating Ethiopian ingredients..."
# Ethiopian Proteins
proteins = [
  { name: "Beef", category: "protein" },
  { name: "Chicken", category: "protein" },
  { name: "Lamb", category: "protein" },
  { name: "Fish", category: "protein" },
  { name: "Eggs", category: "protein" },
  { name: "Lentils", category: "protein" },
  { name: "Split Peas", category: "protein" }
]

# Ethiopian Vegetables
vegetables = [
  { name: "Onions", category: "vegetable" },
  { name: "Tomatoes", category: "vegetable" },
  { name: "Garlic", category: "vegetable" },
  { name: "Ginger", category: "vegetable" },
  { name: "Cabbage", category: "vegetable" },
  { name: "Carrots", category: "vegetable" },
  { name: "Potatoes", category: "vegetable" },
  { name: "Green Beans", category: "vegetable" },
  { name: "Collard Greens", category: "vegetable" },
  { name: "Spinach", category: "vegetable" }
]

# Ethiopian Spices and Seasonings
spices = [
  { name: "Berbere", category: "spice" },
  { name: "Mitmita", category: "spice" },
  { name: "Cardamom", category: "spice" },
  { name: "Coriander", category: "spice" },
  { name: "Cumin", category: "spice" },
  { name: "Fenugreek", category: "spice" },
  { name: "Turmeric", category: "spice" },
  { name: "Black Pepper", category: "spice" },
  { name: "Cinnamon", category: "spice" },
  { name: "Cloves", category: "spice" }
]

# Grains and Dairy
grains_dairy = [
  { name: "Injera", category: "grain" },
  { name: "Teff", category: "grain" },
  { name: "Rice", category: "grain" },
  { name: "Barley", category: "grain" },
  { name: "Butter", category: "dairy" },
  { name: "Cheese", category: "dairy" },
  { name: "Yogurt", category: "dairy" }
]

# Create ingredients
all_ingredients = proteins + vegetables + spices + grains_dairy
ingredient_objects = {}

all_ingredients.each do |ingredient_data|
  ingredient = Ingredient.create!(ingredient_data)
  ingredient_objects[ingredient.name] = ingredient
  puts "Created ingredient: #{ingredient.name}"
end

puts "Creating Ethiopian recipes..."

# Recipe 1: Doro Wat (Ethiopian Chicken Stew)
doro_wat = Recipe.create!(
  name: "doro_wat",
  title: "Doro Wat",
  category: "Main Course",
  cook_time: "2 hours",
  servings: 6,
  description: "Traditional Ethiopian chicken stew with hard-boiled eggs, slow-cooked in berbere sauce.",
  author: author1
)

# Add ingredients to Doro Wat
doro_ingredients = [
  { name: "Chicken", optional: false },
  { name: "Eggs", optional: false },
  { name: "Onions", optional: false },
  { name: "Berbere", optional: false },
  { name: "Garlic", optional: false },
  { name: "Ginger", optional: false },
  { name: "Butter", optional: false },
  { name: "Cardamom", optional: true },
  { name: "Cinnamon", optional: true }
]

doro_ingredients.each do |ing|
  RecipeIngredient.create!(
    recipe: doro_wat,
    ingredient: ingredient_objects[ing[:name]],
    is_optional: ing[:optional]
  )
end

# Add instructions for Doro Wat
doro_instructions = [
  "Clean and cut chicken into pieces",
  "Boil eggs until hard-boiled, then peel and set aside",
  "Sauté finely chopped onions until golden brown",
  "Add garlic and ginger, cook for 2 minutes",
  "Add berbere spice and cook for 5 minutes",
  "Add chicken pieces and brown on all sides",
  "Add water and simmer for 1 hour",
  "Add hard-boiled eggs and simmer for 30 more minutes",
  "Serve hot with injera"
]

doro_instructions.each_with_index do |instruction, index|
  Instruction.create!(
    recipe: doro_wat,
    step_number: index + 1,
    description: instruction
  )
end

# Recipe 2: Kitfo (Ethiopian Beef Tartare)
kitfo = Recipe.create!(
  name: "kitfo",
  title: "Kitfo",
  category: "Appetizer",
  cook_time: "30 minutes",
  servings: 4,
  description: "Ethiopian beef tartare seasoned with mitmita and served with injera.",
  author: author2
)

kitfo_ingredients = [
  { name: "Beef", optional: false },
  { name: "Mitmita", optional: false },
  { name: "Butter", optional: false },
  { name: "Cardamom", optional: true },
  { name: "Cheese", optional: true }
]

kitfo_ingredients.each do |ing|
  RecipeIngredient.create!(
    recipe: kitfo,
    ingredient: ingredient_objects[ing[:name]],
    is_optional: ing[:optional]
  )
end

kitfo_instructions = [
  "Select the finest quality beef and mince very finely",
  "Mix mitmita spice with melted butter",
  "Combine minced beef with spiced butter mixture",
  "Season with salt to taste",
  "Serve immediately with injera and optional cheese"
]

kitfo_instructions.each_with_index do |instruction, index|
  Instruction.create!(
    recipe: kitfo,
    step_number: index + 1,
    description: instruction
  )
end

# Recipe 3: Shiro Wat (Ethiopian Chickpea Stew)
shiro = Recipe.create!(
  name: "shiro_wat",
  title: "Shiro Wat",
  category: "Vegetarian",
  cook_time: "45 minutes",
  servings: 4,
  description: "Creamy Ethiopian chickpea flour stew, perfect for vegetarians.",
  author: author1
)

shiro_ingredients = [
  { name: "Lentils", optional: false },
  { name: "Onions", optional: false },
  { name: "Garlic", optional: false },
  { name: "Ginger", optional: false },
  { name: "Berbere", optional: false },
  { name: "Tomatoes", optional: true },
  { name: "Green Beans", optional: true }
]

shiro_ingredients.each do |ing|
  RecipeIngredient.create!(
    recipe: shiro,
    ingredient: ingredient_objects[ing[:name]],
    is_optional: ing[:optional]
  )
end

shiro_instructions = [
  "Soak lentils overnight and cook until tender",
  "Sauté onions until golden",
  "Add garlic and ginger, cook for 2 minutes",
  "Add berbere and cook for 3 minutes",
  "Add cooked lentils and simmer",
  "Add water to achieve desired consistency",
  "Simmer for 20 minutes, stirring occasionally",
  "Serve hot with injera"
]

shiro_instructions.each_with_index do |instruction, index|
  Instruction.create!(
    recipe: shiro,
    step_number: index + 1,
    description: instruction
  )
end

