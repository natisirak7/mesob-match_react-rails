require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'

# Add additional requires
begin
  require 'shoulda/matchers'
rescue LoadError
  # shoulda-matchers not available
end

begin
  require 'factory_bot_rails'
rescue LoadError
  # factory_bot_rails not available
end

# Load support files
Dir[Rails.root.join('spec', 'support', '**', '*.rb')].sort.each { |f| require f }

# Maintain test schema
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

RSpec.configure do |config|
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  
  # Include FactoryBot methods
  config.include FactoryBot::Syntax::Methods if defined?(FactoryBot)
  
  # Include request spec helper for API tests
  config.include RequestSpecHelper, type: :request
end

# Configure shoulda-matchers
if defined?(Shoulda::Matchers)
  Shoulda::Matchers.configure do |config|
    config.integrate do |with|
      with.test_framework :rspec
      with.library :rails
    end
  end
end
