class Api::V1::AuthenticationController < ApplicationController
  skip_before_action :authenticate_request, only: [:login, :register]

  # POST /api/v1/auth/login
  def login
    authenticate_params = login_params
    auth_token = AuthenticateUser.new(authenticate_params[:email], authenticate_params[:password]).call
    user = User.find_by(email: authenticate_params[:email])
    json_response(auth_token: auth_token, user: user_data(user))
  end

  # POST /api/v1/auth/register
  def register
    user = User.new(user_params)
    
    if user.save
      auth_token = JsonWebToken.encode(user_id: user.id)
      response = { message: Message.account_created, auth_token: auth_token, user: user_data(user) }
      json_response(response, :created)
    else
      json_response({ message: Message.account_not_created, errors: user.errors.full_messages }, :unprocessable_entity)
    end
  end

  # GET /api/v1/auth/me
  def me
    json_response(user: user_data(current_user))
  end

  # DELETE /api/v1/auth/logout
  def logout
    # For JWT, logout is handled client-side by removing the token
    # Optionally, you could implement a token blacklist here
    json_response({ message: 'Logged out successfully' })
  end

  private

  def login_params
    # Handle both flat and nested parameter structures
    if params[:authentication].present?
      params.require(:authentication).permit(:email, :password)
    else
      params.permit(:email, :password)
    end
  end

  def user_params
    # Handle both flat and nested parameter structures
    if params[:user].present?
      params.require(:user).permit(:name, :email, :password, :role)
    else
      params.permit(:name, :email, :password, :role)
    end
  end

  def user_data(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  end
end
