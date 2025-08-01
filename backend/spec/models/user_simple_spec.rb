require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'basic validations' do
    it 'is valid with valid attributes' do
      user = User.new(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      )
      expect(user).to be_valid
    end

    it 'is invalid without a name' do
      user = User.new(
        email: 'test@example.com',
        password: 'password123'
      )
      expect(user).not_to be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end

    it 'is invalid without an email' do
      user = User.new(
        name: 'Test User',
        password: 'password123'
      )
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it 'is invalid with duplicate email' do
      User.create!(
        name: 'First User',
        email: 'test@example.com',
        password: 'password123'
      )
      
      user = User.new(
        name: 'Second User',
        email: 'test@example.com',
        password: 'password123'
      )
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("has already been taken")
    end
  end

  describe 'role enum' do
    it 'defaults to author role' do
      user = User.create!(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      )
      expect(user.role).to eq('author')
      expect(user.author?).to be true
    end

    it 'can be set to admin' do
      user = User.create!(
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: :admin
      )
      expect(user.role).to eq('admin')
      expect(user.admin?).to be true
    end
  end

  describe 'associations' do
    it 'can have recipes' do
      user = User.create!(
        name: 'Chef User',
        email: 'chef@example.com',
        password: 'password123'
      )
      
      expect(user.recipes).to be_empty
      expect { user.recipes.build(title: 'Test Recipe') }.not_to raise_error
    end
  end
end
