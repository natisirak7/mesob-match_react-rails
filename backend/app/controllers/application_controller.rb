class ApplicationController < ActionController::API
  include ActionController::Cookies
  
  before_action :authenticate_request
  
  private
  
  def authenticate_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    begin
      decoded = JsonWebToken.decode(header)
      @current_user = User.find(decoded[:user_id])
    rescue ActiveRecord::RecordNotFound => e
      json_response({ message: 'Invalid token' }, :unauthorized)
    rescue JWT::DecodeError => e
      json_response({ message: 'Invalid token' }, :unauthorized)
    end
  end
  
  def current_user
    @current_user
  end
  
  # Helper method for consistent JSON responses
  def json_response(object, status = :ok)
    render json: object, status: status
  end
end