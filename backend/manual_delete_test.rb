#!/usr/bin/env ruby

require 'rails_helper'

RSpec.describe 'Manual Recipe Deletion Test', type: :request do
  let(:user) { create(:user) }
  let!(:recipe) { create(:recipe, :complete, author: user) }

  it 'manually deletes recipe dependencies' do
    puts "Recipe count before: #{Recipe.count}"
    puts "RecipeIngredient count before: #{RecipeIngredient.count}"
    puts "Instruction count before: #{Instruction.count}"
    
    # Try manual deletion of dependencies first
    recipe.recipe_ingredients.destroy_all
    puts "RecipeIngredient count after manual delete: #{RecipeIngredient.count}"
    
    recipe.instructions.destroy_all
    puts "Instruction count after manual delete: #{Instruction.count}"
    
    # Now try to delete the recipe
    result = recipe.destroy
    puts "Recipe destroy result: #{result}"
    puts "Recipe count after: #{Recipe.count}"
    puts "Recipe errors: #{recipe.errors.full_messages}" unless result
  end
end
