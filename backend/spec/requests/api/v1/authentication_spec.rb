require 'rails_helper'

RSpec.describe 'Api::V1::Authentication', type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, :admin) }

  describe 'POST /api/v1/auth/register' do
    let(:valid_attributes) do
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
    end

    context 'with valid parameters' do
      it 'creates a new user and returns auth token' do
        expect {
          post '/api/v1/auth/register', params: valid_attributes.to_json, headers: json_headers
        }.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response).to include('auth_token', 'message', 'user')
        expect(json_response['message']).to eq('Account created successfully')
        expect(json_response['user']['email']).to eq('john@example.com')
        expect(json_response['user']['role']).to eq('author')
      end
    end

    context 'with invalid parameters' do
      it 'returns error for missing email' do
        post '/api/v1/auth/register', params: valid_attributes.except(:email).to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response).to include('message', 'errors')
      end

      it 'returns error for duplicate email' do
        create(:user, email: 'john@example.com')
        post '/api/v1/auth/register', params: valid_attributes.to_json, headers: json_headers

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response).to include('message', 'errors')
      end
    end
  end

  describe 'POST /api/v1/auth/login' do
    let(:login_params) do
      {
        email: user.email,
        password: 'password123'
      }
    end

    context 'with valid credentials' do
      it 'returns auth token' do
        post '/api/v1/auth/login', params: login_params.to_json, headers: json_headers

        expect(response).to have_http_status(:ok)
        expect(json_response).to include('auth_token')
        expect(json_response['auth_token']).to be_present
      end
    end

    context 'with invalid credentials' do
      xit 'returns error for wrong password' do
        post '/api/v1/auth/login', params: login_params.merge(password: 'wrong').to_json, headers: json_headers

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to eq('Invalid credentials')
      end

      xit 'returns error for non-existent email' do
        post '/api/v1/auth/login', params: login_params.merge(email: 'nonexistent@example.com').to_json, headers: json_headers

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to eq('Invalid credentials')
      end
    end
  end

  describe 'GET /api/v1/auth/me' do
    context 'with valid token' do
      it 'returns current user info' do
        get '/api/v1/auth/me', headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response['user']).to include('id', 'name', 'email', 'role')
        expect(json_response['user']['email']).to eq(user.email)
        expect(json_response['user']['role']).to eq(user.role)
      end
    end

    context 'without token' do
      xit 'returns unauthorized' do
        get '/api/v1/auth/me'

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to include('Invalid token')
      end
    end

    context 'with invalid token' do
      xit 'returns unauthorized' do
        get '/api/v1/auth/me', headers: { 'Authorization' => 'Bearer invalid_token' }

        expect(response).to have_http_status(:unauthorized)
        expect(json_response['message']).to include('Invalid token')
      end
    end
  end

  describe 'DELETE /api/v1/auth/logout' do
    it 'returns success message' do
      delete '/api/v1/auth/logout', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response['message']).to eq('Logged out successfully')
    end
  end
end
