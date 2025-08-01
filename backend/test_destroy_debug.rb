#!/usr/bin/env ruby

require 'rails_helper'

RSpec.describe 'Recipe Destroy Debug', type: :request do
  let(:user) { create(:user) }
  let!(:recipe) { create(:recipe, :complete, author: user) }

  it 'debugs recipe destroy' do
    puts "Recipe count before: #{Recipe.count}"
    puts "Recipe ID: #{recipe.id}"
    puts "Recipe author: #{recipe.author.name}"
    puts "User: #{user.name}"
    
    delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers(user)
    
    puts "Response status: #{response.status}"
    puts "Response body: #{response.body}"
    puts "Recipe count after: #{Recipe.count}"
    puts "Recipe still exists: #{Recipe.exists?(recipe.id)}"
  end
end
