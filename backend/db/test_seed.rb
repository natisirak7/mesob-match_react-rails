# Minimal test seed to debug User creation issue
puts "Testing User creation..."

begin
  # Test 1: Create user without role (should use default)
  user1 = User.new(
    name: "Test User",
    email: "test@example.com",
    password: "password123"
  )
  puts "User created: #{user1.inspect}"
  puts "User valid? #{user1.valid?}"
  puts "User errors: #{user1.errors.full_messages}" unless user1.valid?
  
  # Test 2: Try to save
  if user1.save
    puts "User saved successfully with ID: #{user1.id}"
  else
    puts "User save failed: #{user1.errors.full_messages}"
  end
  
rescue => e
  puts "Error creating user: #{e.class}: #{e.message}"
  puts e.backtrace.first(5)
end
