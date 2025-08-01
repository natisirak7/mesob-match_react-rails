# Simple seed file to test MesobMatch functionality
puts "Starting seed process..."

# Clear existing data
puts "Clearing existing data..."
RecipeIngredient.destroy_all
Instruction.destroy_all
Recipe.destroy_all
Ingredient.destroy_all
User.destroy_all

puts "Creating test user..."
# Create a test user
user = User.create!(
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  role: "author"
)
puts "Created user: #{user.name}"

puts "Creating ingredients..."
# Create some basic ingredients
chicken = Ingredient.create!(name: "Chicken", category: "protein")
berbere = Ingredient.create!(name: "Berbere", category: "spice")
onions = Ingredient.create!(name: "Onions", category: "vegetable")
eggs = Ingredient.create!(name: "Eggs", category: "protein")

puts "Created #{Ingredient.count} ingredients"

puts "Creating recipe..."
# Create a simple recipe
recipe = Recipe.create!(
  name: "test_doro_wat",
  title: "Test Doro Wat",
  category: "Main Course",
  cook_time: "2 hours",
  servings: 4,
  description: "Test Ethiopian chicken stew",
  author: user
)

puts "Adding ingredients to recipe..."
# Add ingredients to recipe
RecipeIngredient.create!(recipe: recipe, ingredient: chicken, is_optional: false)
RecipeIngredient.create!(recipe: recipe, ingredient: berbere, is_optional: false)
RecipeIngredient.create!(recipe: recipe, ingredient: onions, is_optional: false)
RecipeIngredient.create!(recipe: recipe, ingredient: eggs, is_optional: true)

puts "Adding instructions..."
# Add instructions
Instruction.create!(recipe: recipe, step_number: 1, instruction: "Prepare chicken")
Instruction.create!(recipe: recipe, step_number: 2, instruction: "Cook with berbere")
Instruction.create!(recipe: recipe, step_number: 3, instruction: "Serve hot")

puts "Seed completed successfully!"
puts "Created #{User.count} users"
puts "Created #{Ingredient.count} ingredients"
puts "Created #{Recipe.count} recipes"
puts "Created #{RecipeIngredient.count} recipe-ingredient relationships"
puts "Created #{Instruction.count} instructions"
