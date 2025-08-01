require 'rails_helper'

RSpec.describe 'Api::V1::Recipes', type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }
  let(:other_user) { create(:user) }
  
  let!(:recipe) { create(:recipe, :complete, author: user) }
  let!(:other_recipe) { create(:recipe, :complete, author: other_user) }

  describe 'GET /api/v1/recipes' do
    it 'returns all recipes without authentication' do
      get '/api/v1/recipes'

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)
    end

    it 'includes recipe details' do
      get '/api/v1/recipes'

      recipe_data = json_response.first
      expect(recipe_data).to include('id', 'title', 'description', 'category', 'author')
      expect(recipe_data['author']).to include('name', 'role')
    end
  end

  describe 'GET /api/v1/recipes/:id' do
    it 'returns specific recipe without authentication' do
      get "/api/v1/recipes/#{recipe.id}"

      expect(response).to have_http_status(:ok)
      expect(json_response['id']).to eq(recipe.id)
      expect(json_response['title']).to eq(recipe.title)
    end

    it 'returns 404 for non-existent recipe' do
      get '/api/v1/recipes/999999'

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/recipes/find_by_ingredients' do
    let!(:beef) { create(:ingredient, :protein, name: 'Beef') }
    let!(:onions) { create(:ingredient, :vegetable, name: 'Onions') }

    before do
      create(:recipe_ingredient, recipe: recipe, ingredient: beef)
      create(:recipe_ingredient, recipe: recipe, ingredient: onions)
      create(:recipe_ingredient, recipe: other_recipe, ingredient: beef)
    end

    it 'finds recipes by ingredients without authentication' do
      post '/api/v1/recipes/find_by_ingredients', 
           params: { ingredient_ids: [beef.id] }.to_json, 
           headers: json_headers

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)
    end
  end

  describe 'POST /api/v1/recipes' do
    let(:valid_attributes) do
      {
        recipe: {
          name: 'test_recipe',
          title: 'Test Recipe',
          description: 'A test recipe',
          category: 'appetizer',
          prep_time: 15,
          cook_time: 30,
          servings: 4,
          difficulty: 'easy',
          cuisine: 'Ethiopian'
        },
        ingredient_data: [
          { ingredient_id: create(:ingredient).id, quantity: '1 cup', is_optional: false }
        ],
        instructions: ['Step 1', 'Step 2']
      }
    end

    context 'with authentication' do
      it 'creates a new recipe' do
        expect {
          post '/api/v1/recipes', params: valid_attributes.to_json, headers: auth_json_headers(user)
        }.to change(Recipe, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response['message']).to eq('Recipe created successfully')
        expect(json_response['recipe']['title']).to eq('Test Recipe')
        expect(json_response['recipe']['author']['id']).to eq(user.id)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        post '/api/v1/recipes', params: valid_attributes.to_json, headers: json_headers

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to eq('Invalid token')
      end
    end
  end

  describe 'PATCH /api/v1/recipes/:id' do
    let(:update_attributes) do
      {
        recipe: {
          title: 'Updated Recipe Title',
          description: 'Updated description'
        }
      }
    end

    context 'as recipe owner' do
      it 'updates the recipe' do
        patch "/api/v1/recipes/#{recipe.id}", 
              params: update_attributes.to_json, 
              headers: auth_json_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response['message']).to eq('Recipe updated successfully')
        expect(json_response['recipe']['title']).to eq('Updated Recipe Title')
      end
    end

    context 'as admin' do
      it 'allows admin to update any recipe' do
        patch "/api/v1/recipes/#{other_recipe.id}", 
              params: update_attributes.to_json, 
              headers: auth_json_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(json_response['message']).to eq('Recipe updated successfully')
      end
    end

    context 'as different user' do
      it 'returns unauthorized' do
        patch "/api/v1/recipes/#{other_recipe.id}", 
              params: update_attributes.to_json, 
              headers: auth_json_headers(user)

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to include('Unauthorized')
      end
    end
  end

  describe 'DELETE /api/v1/recipes/:id' do
    context 'as recipe owner' do
      it 'deletes the recipe' do
        expect {
          delete "/api/v1/recipes/#{recipe.id}", headers: auth_headers(user)
        }.to change(Recipe, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response['message']).to include('deleted successfully')
      end
    end

    context 'as admin' do
      it 'allows admin to delete any recipe' do
        expect {
          delete "/api/v1/recipes/#{other_recipe.id}", headers: auth_headers(admin)
        }.to change(Recipe, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end

    context 'as different user' do
      it 'returns unauthorized' do
        delete "/api/v1/recipes/#{other_recipe.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to include('Unauthorized')
      end
    end
  end
end
