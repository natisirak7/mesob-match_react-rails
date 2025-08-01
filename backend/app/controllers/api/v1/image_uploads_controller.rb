# app/controllers/api/v1/image_uploads_controller.rb
class Api::V1::ImageUploadsController < ApplicationController
  before_action :authenticate_request
  before_action :set_recipe, only: [:upload, :delete]
  before_action :authorize_recipe_owner, only: [:upload, :delete]

  # POST /api/v1/recipes/:id/image
  def upload
    if params[:image].present?
      @recipe.image.attach(params[:image])
      
      if @recipe.reload.image.attached?
        json_response({
          message: 'Image uploaded successfully',
          image: {
            url: Rails.application.routes.url_helpers.rails_blob_url(@recipe.image, only_path: false),
            filename: @recipe.image.filename.to_s,
            content_type: @recipe.image.content_type,
            byte_size: @recipe.image.byte_size
          }
        })
      else
        json_response({
          message: 'Image upload failed'
        }, :unprocessable_entity)
      end
    else
      json_response({
        message: 'No image file provided'
      }, :bad_request)
    end
  end

  # DELETE /api/v1/recipes/:id/image
  def delete
    if @recipe.image.attached?
      @recipe.image.purge
      json_response({
        message: 'Image deleted successfully'
      })
    else
      json_response({
        message: 'No image attached to this recipe'
      }, :not_found)
    end
  end

  private

  def set_recipe
    @recipe = Recipe.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    json_response({ error: 'Recipe not found' }, :not_found)
  end

  def authorize_recipe_owner
    unless current_user&.admin? || @recipe.author == current_user
      json_response({ message: 'Unauthorized - You can only modify your own recipes' }, :unauthorized)
      return false
    end
  end
end