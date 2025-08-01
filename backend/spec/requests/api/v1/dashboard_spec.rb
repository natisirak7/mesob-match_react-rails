require 'rails_helper'

RSpec.describe 'Api::V1::Dashboard', type: :request do
  let(:admin) { create(:user, :admin) }
  let(:author) { create(:user, :author) }
  let(:other_author) { create(:user, :author) }

  let!(:admin_recipe) { create(:recipe, :complete, author: admin) }
  let!(:author_recipe) { create(:recipe, :complete, author: author) }
  let!(:other_recipe) { create(:recipe, :complete, author: other_author) }

  describe 'GET /api/v1/dashboard' do
    context 'as admin user' do
      it 'returns all recipes with user info' do
        get '/api/v1/dashboard', headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(json_response).to include('user', 'recipes', 'total_recipes', 'user_role')
        expect(json_response['user']['role']).to eq('admin')
        expect(json_response['total_recipes']).to eq(3)
        expect(json_response['recipes'].length).to eq(3)
      end

      it 'includes complete recipe details' do
        get '/api/v1/dashboard', headers: auth_headers(admin)

        recipe_data = json_response['recipes'].first
        expect(recipe_data).to include('id', 'title', 'author', 'ingredients', 'instructions')
        expect(recipe_data['author']).to include('name', 'role')
      end
    end

    context 'as author user' do
      it 'returns only user own recipes' do
        get '/api/v1/dashboard', headers: auth_headers(author)

        expect(response).to have_http_status(:ok)
        expect(json_response['user']['role']).to eq('author')
        expect(json_response['total_recipes']).to eq(1)
        expect(json_response['recipes'].length).to eq(1)
        expect(json_response['recipes'].first['author']['id']).to eq(author.id)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        get '/api/v1/dashboard'

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to eq('Invalid token')
      end
    end
  end

  describe 'GET /api/v1/dashboard/stats' do
    context 'as admin user' do
      it 'returns system-wide statistics' do
        get '/api/v1/dashboard/stats', headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(json_response).to include(
          'total_recipes', 'total_users', 'total_ingredients',
          'recent_recipes', 'recipes_by_category', 'users_by_role'
        )
        expect(json_response['total_recipes']).to eq(3)
        expect(json_response['total_users']).to eq(3)
      end
    end

    context 'as author user' do
      it 'returns user-specific statistics' do
        get '/api/v1/dashboard/stats', headers: auth_headers(author)

        expect(response).to have_http_status(:ok)
        expect(json_response).to include(
          'my_recipes', 'my_recent_recipes', 'my_recipes_by_category'
        )
        expect(json_response['my_recipes']).to eq(1)
        expect(json_response).to include('total_users')
      end
    end
  end

  describe 'GET /api/v1/dashboard/my_recipes' do
    it 'returns current user recipes' do
      get '/api/v1/dashboard/my_recipes', headers: auth_headers(author)

      expect(response).to have_http_status(:ok)
      expect(json_response).to include('recipes', 'total')
      expect(json_response['total']).to eq(1)
      expect(json_response['recipes'].first['author']['id']).to eq(author.id)
    end
  end

  describe 'GET /api/v1/dashboard/all_recipes' do
    context 'as admin user' do
      it 'returns all recipes' do
        get '/api/v1/dashboard/all_recipes', headers: auth_headers(admin)

        expect(response).to have_http_status(:ok)
        expect(json_response).to include('recipes', 'total')
        expect(json_response['total']).to eq(3)
      end
    end

    context 'as author user' do
      it 'returns unauthorized' do
        get '/api/v1/dashboard/all_recipes', headers: auth_headers(author)

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to include('Admin access required')
      end
    end
  end
end
