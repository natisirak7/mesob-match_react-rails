#!/usr/bin/env ruby

require_relative 'config/environment'

# Create test data
user = User.create!(name: 'Test User', email: 'test@example.com', password: 'password123', role: 'author')
recipe = Recipe.create!(
  name: 'Test Recipe',
  title: 'Test Recipe Title', 
  description: 'Test description',
  category: 'main_course',
  prep_time: 30,
  cook_time: 45,
  servings: 4,
  difficulty: 'medium',
  cuisine: 'Ethiopian',
  author: user
)

puts "Created recipe with ID: #{recipe.id}"
puts "Recipe count before destroy: #{Recipe.count}"

# Try to destroy the recipe
begin
  recipe.destroy!
  puts "Recipe destroyed successfully"
  puts "Recipe count after destroy: #{Recipe.count}"
rescue => e
  puts "Error destroying recipe: #{e.message}"
  puts "Recipe still exists: #{Recipe.exists?(recipe.id)}"
end
