require 'rails_helper'

RSpec.describe 'Basic MesobMatch Functionality', type: :model do
  describe 'User model' do
    it 'creates a user successfully' do
      user = User.create!(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      )
      expect(user.persisted?).to be true
      expect(user.author?).to be true
    end
  end

  describe 'Ingredient model' do
    it 'creates an ingredient successfully' do
      ingredient = Ingredient.create!(
        name: 'Test Ingredient',
        category: 'meat'
      )
      expect(ingredient.persisted?).to be true
      expect(ingredient.category).to eq('meat')
    end
  end

  describe 'Recipe model with ingredient matching' do
    let!(:user) { User.create!(name: 'Chef', email: 'chef@example.com', password: 'password123') }
    let!(:beef) { Ingredient.create!(name: 'Beef', category: 'meat') }
    let!(:onions) { Ingredient.create!(name: 'Onions', category: 'vegetables') }

    it 'creates a recipe with ingredients' do
      recipe = Recipe.create!(
        title: 'Test Recipe',
        description: 'A test recipe',
        category: 'main_course',
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'easy',
        cuisine: 'Ethiopian',
        author: user
      )

      recipe.recipe_ingredients.create!(ingredient: beef, quantity: '1 lb')
      recipe.recipe_ingredients.create!(ingredient: onions, quantity: '2 cups')

      expect(recipe.persisted?).to be true
      expect(recipe.ingredients.count).to eq(2)
      expect(recipe.ingredients).to include(beef, onions)
    end

    it 'finds recipes by ingredients (core MesobMatch feature)' do
      recipe1 = Recipe.create!(
        title: 'Beef Stew',
        description: 'Ethiopian beef stew',
        category: 'main_course',
        prep_time: 20,
        cook_time: 60,
        servings: 6,
        difficulty: 'medium',
        cuisine: 'Ethiopian',
        author: user
      )

      recipe2 = Recipe.create!(
        title: 'Onion Soup',
        description: 'Simple onion soup',
        category: 'appetizer',
        prep_time: 10,
        cook_time: 30,
        servings: 4,
        difficulty: 'easy',
        cuisine: 'Ethiopian',
        author: user
      )

      # Add ingredients to recipes
      recipe1.recipe_ingredients.create!(ingredient: beef, quantity: '2 lbs')
      recipe1.recipe_ingredients.create!(ingredient: onions, quantity: '1 cup')
      recipe2.recipe_ingredients.create!(ingredient: onions, quantity: '3 cups')

      # Test ingredient-based recipe matching
      beef_recipes = Recipe.find_by_ingredients([beef.id])
      onion_recipes = Recipe.find_by_ingredients([onions.id])

      expect(beef_recipes).to include(recipe1)
      expect(beef_recipes).not_to include(recipe2)
      expect(onion_recipes).to include(recipe1, recipe2)
    end
  end

  describe 'JWT Authentication' do
    let!(:user) { User.create!(name: 'Auth User', email: 'auth@example.com', password: 'password123') }

    it 'generates and decodes JWT tokens' do
      token = JwtService.encode(user_id: user.id)
      expect(token).to be_present

      decoded = JwtService.decode(token)
      expect(decoded[:user_id]).to eq(user.id)
    end
  end
end
