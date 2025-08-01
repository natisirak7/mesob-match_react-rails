require 'rails_helper'

RSpec.describe Ingredient, type: :model do
  describe 'validations' do
    subject { build(:ingredient) }

    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
    it { should validate_length_of(:name).is_at_most(100) }
    it { should validate_presence_of(:category) }
  end

  describe 'associations' do
    it { should have_many(:recipe_ingredients).dependent(:destroy) }
    it { should have_many(:recipes).through(:recipe_ingredients) }
  end

  describe 'scopes' do
    let!(:protein) { create(:ingredient, :protein) }
    let!(:vegetable) { create(:ingredient, :vegetable) }
    let!(:spice) { create(:ingredient, :spice) }

    describe '.by_category' do
      it 'returns ingredients by category' do
        proteins = Ingredient.by_category('meat')
        expect(proteins).to include(protein)
        expect(proteins).not_to include(vegetable, spice)
      end
    end

    describe '.search' do
      it 'finds ingredients by name' do
        results = Ingredient.search(protein.name)
        expect(results).to include(protein)
      end

      it 'is case insensitive' do
        results = Ingredient.search(protein.name.upcase)
        expect(results).to include(protein)
      end
    end
  end

  describe 'factory' do
    it 'creates a valid ingredient' do
      ingredient = build(:ingredient)
      expect(ingredient).to be_valid
    end

    it 'creates ingredients with specific categories' do
      protein = build(:ingredient, :protein)
      expect(protein.category).to eq('meat')
    end
  end
end
