Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by uptime monitors and load balancers.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  namespace :api do
    namespace :v1 do
      # Users routes with authentication
      resources :users do
        member do
          get :recipes, to: 'users#user_recipes'
        end
      end
      
      # Authentication routes
      post 'auth/login', to: 'authentication#login'
      post 'auth/register', to: 'authentication#register'
      delete 'auth/logout', to: 'authentication#logout'
      get 'auth/me', to: 'authentication#me'

      # Dashboard routes (role-based recipe management)
      get 'dashboard', to: 'dashboard#index'
      get 'dashboard/stats', to: 'dashboard#stats'
      get 'dashboard/my_recipes', to: 'dashboard#my_recipes'
      get 'dashboard/all_recipes', to: 'dashboard#all_recipes'

      # Ingredients routes with categorization
      resources :ingredients do
        collection do
          get :categorized
          get :categories
          get :search
          get :test_auth
          get 'by_category/:category', to: 'ingredients#by_category'
          # Admin-only category management routes
          post 'categories', to: 'ingredients#create_category'
          put 'categories/:id', to: 'ingredients#update_category'
          delete 'categories/:id', to: 'ingredients#delete_category'
        end
      end

      # Recipes routes with MesobMatch functionality
      resources :recipes do
        collection do
          post :find_by_ingredients  # Core MesobMatch feature
          get :makeable
          get :categories
          get :popular
          get :debug_images
        end
        
        # Image upload routes
        member do
          post 'image', to: 'image_uploads#upload'
          delete 'image', to: 'image_uploads#delete'
        end
      end

      # Recipe ingredients management
      resources :recipe_ingredients, only: [:create, :update, :destroy]
      
      # Instructions management
      resources :instructions, only: [:create, :update, :destroy]
    end
  end
end
