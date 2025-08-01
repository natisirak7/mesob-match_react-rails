class Api::V1::UsersController < ApplicationController
  skip_before_action :authenticate_request, only: [:register, :login, :index, :show]
  before_action :authorize_admin_or_self, only: [:update, :destroy]
  before_action :authorize_admin, only: [:index]
  before_action :set_user, only: [:show, :update, :destroy, :user_recipes]

  # GET /api/v1/users
  def index
    @users = User.all
    json_response(@users.as_json(except: [:password_digest]))
  end

  # GET /api/v1/users/1
  def show
    json_response(@user.as_json(except: [:password_digest], include: [:recipes]))
  end

  # POST /api/v1/users/register
  def register
    @user = User.new(user_params)

    if @user.save
      json_response({ 
        user: @user.as_json(except: [:password_digest]),
        message: 'User created successfully'
      }, :created)
    else
      json_response({ 
        message: 'Registration failed',
        errors: @user.errors.full_messages 
      }, :unprocessable_entity)
    end
  end

  # POST /api/v1/users/login
  def login
    @user = User.find_by(email: params[:email])

    if @user&.authenticate(params[:password])
      # Generate JWT token
      token = JsonWebToken.encode(user_id: @user.id)
      
      json_response({
        user: @user.as_json(except: [:password_digest]),
        token: token,
        message: 'Login successful'
      })
    else
      json_response({ 
        message: 'Invalid email or password' 
      }, :unauthorized)
    end
  end

  # PATCH/PUT /api/v1/users/1
  def update
    if @user.update(user_params)
      json_response(@user.as_json(except: [:password_digest]))
    else
      json_response({ 
        message: 'Update failed',
        errors: @user.errors.full_messages 
      }, :unprocessable_entity)
    end
  end

  # DELETE /api/v1/users/1
  def destroy
    @user.destroy
    json_response({ message: 'User deleted successfully' })
  end

  # GET /api/v1/users/1/recipes
  def user_recipes
    @recipes = @user.recipes.includes(:ingredients, :instructions)
    json_response(@recipes.as_json(include: [:ingredients, :instructions]))
  end

  private

  def set_user
    @user = User.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    json_response({ error: 'User not found' }, :not_found)
  end

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation, :role)
  rescue ActionController::ParameterMissing
    # Handle case where params aren't wrapped in :user
    params.permit(:name, :email, :password, :password_confirmation, :role)
  end

  def authorize_admin
    unless current_user&.admin?
      json_response({ message: 'Unauthorized - Admin access required' }, :unauthorized)
      return false
    end
  end

  def authorize_admin_or_self
    user = User.find(params[:id])
    unless current_user&.admin? || current_user == user
      json_response({ message: 'Unauthorized - You can only modify your own account' }, :unauthorized)
      return false
    end
  rescue ActiveRecord::RecordNotFound
    json_response({ error: 'User not found' }, :not_found)
    return false
  end
end