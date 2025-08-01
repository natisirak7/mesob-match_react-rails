require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:name) }
    it { should validate_length_of(:name).is_at_most(100) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should validate_length_of(:email).is_at_most(100) }
    it { should have_secure_password }
  end

  describe 'associations' do
    it { should have_many(:recipes).with_foreign_key('author_id').dependent(:destroy) }
  end

  describe 'enums' do
    it { should define_enum_for(:role).with_values(author: 0, admin: 1) }
  end

  describe 'callbacks' do
    context 'when creating a user without role' do
      it 'sets default role to author' do
        user = User.new(name: 'Test User', email: 'test@example.com', password: 'password123')
        user.save
        expect(user.role).to eq('author')
      end
    end
  end

  describe 'role methods' do
    let(:admin_user) { create(:user, :admin) }
    let(:author_user) { create(:user, :author) }

    it 'correctly identifies admin users' do
      expect(admin_user.admin?).to be true
      expect(author_user.admin?).to be false
    end

    it 'correctly identifies author users' do
      expect(author_user.author?).to be true
      expect(admin_user.author?).to be false
    end
  end

  describe 'factory' do
    it 'creates a valid user' do
      user = build(:user)
      expect(user).to be_valid
    end

    it 'creates a valid admin user' do
      admin = build(:user, :admin)
      expect(admin).to be_valid
      expect(admin.admin?).to be true
    end
  end
end
