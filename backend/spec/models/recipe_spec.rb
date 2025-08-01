require 'rails_helper'

RSpec.describe Recipe, type: :model do
  describe 'validations' do
    subject { build(:recipe) }

    it { should validate_presence_of(:title) }
    it { should validate_length_of(:title).is_at_most(255) }
    
    
  end

  describe 'associations' do
    it { should belong_to(:author).class_name('User') }
    it { should have_many(:recipe_ingredients).dependent(:destroy) }
    it { should have_many(:ingredients).through(:recipe_ingredients) }
    it { should have_many(:instructions).dependent(:destroy) }
    it { should have_one_attached(:image) }
  end

  describe 'scopes and class methods' do
    let!(:beef) { create(:ingredient, :protein, name: 'Beef') }
    let!(:onions) { create(:ingredient, :vegetable, name: 'Onions') }
    let!(:berbere) { create(:ingredient, :spice, name: 'Berbere') }
    
    let!(:recipe1) { create(:recipe, title: 'Doro Wat') }
    let!(:recipe2) { create(:recipe, title: 'Kitfo') }
    let!(:recipe3) { create(:recipe, title: 'Shiro') }

    before do
      # Recipe 1 has beef, onions, berbere
      create(:recipe_ingredient, recipe: recipe1, ingredient: beef)
      create(:recipe_ingredient, recipe: recipe1, ingredient: onions)
      create(:recipe_ingredient, recipe: recipe1, ingredient: berbere)
      
      # Recipe 2 has beef, berbere
      create(:recipe_ingredient, recipe: recipe2, ingredient: beef)
      create(:recipe_ingredient, recipe: recipe2, ingredient: berbere)
      
      # Recipe 3 has onions, berbere
      create(:recipe_ingredient, recipe: recipe3, ingredient: onions)
      create(:recipe_ingredient, recipe: recipe3, ingredient: berbere)
    end

    describe '.find_by_ingredients' do
      it 'finds recipes with all specified ingredients' do
        results = Recipe.find_by_ingredients([beef.id, berbere.id], 'all')
        expect(results).to include(recipe1, recipe2)
        expect(results).not_to include(recipe3)
      end

      it 'returns empty when no recipes match' do
        non_existent_ingredient = create(:ingredient, name: 'Non-existent')
        results = Recipe.find_by_ingredients([non_existent_ingredient.id])
        expect(results).to be_empty
      end
    end

    describe '.recipes_with_all_ingredients' do
      it 'finds recipes containing all specified ingredients' do
        results = Recipe.recipes_with_all_ingredients([beef.id, berbere.id])
        expect(results).to include(recipe1, recipe2)
        expect(results).not_to include(recipe3)
      end
    end

    describe '.recipes_with_exact_ingredients' do
      it 'finds recipes with exactly the specified ingredients' do
        results = Recipe.recipes_with_exact_ingredients([beef.id, berbere.id])
        expect(results).to include(recipe2)
        expect(results).not_to include(recipe1, recipe3)
      end
    end
  end

  describe 'image validation' do
    let(:recipe) { build(:recipe) }

    context 'when image is attached' do
      before do
        # Mock image attachment for testing
        allow(recipe).to receive_message_chain(:image, :attached?).and_return(true)
        allow(recipe).to receive_message_chain(:image, :blob, :byte_size).and_return(1.megabyte)
        allow(recipe).to receive_message_chain(:image, :blob, :content_type).and_return('image/jpeg')
      end

      it 'is valid with acceptable image' do
        expect(recipe).to be_valid
      end
    end

    context 'when image is too large' do
      before do
        allow(recipe).to receive_message_chain(:image, :attached?).and_return(true)
        allow(recipe).to receive_message_chain(:image, :blob, :byte_size).and_return(16.megabytes)
        allow(recipe).to receive_message_chain(:image, :blob, :content_type).and_return('image/jpeg')
      end

      xit 'is invalid' do
        recipe.valid?
        expect(recipe.errors[:image]).to include('is too big (should be at most 15MB)')
      end
    end

    context 'when image has wrong content type' do
      before do
        allow(recipe).to receive_message_chain(:image, :attached?).and_return(true)
        allow(recipe).to receive_message_chain(:image, :blob, :byte_size).and_return(1.megabyte)
        allow(recipe).to receive_message_chain(:image, :blob, :content_type).and_return('application/pdf')
      end

      xit 'is invalid' do
        recipe.valid?
        expect(recipe.errors[:image]).to include('must be a JPEG, PNG, or GIF')
      end
    end
  end

  describe 'factory' do
    it 'creates a valid recipe' do
      recipe = build(:recipe)
      expect(recipe).to be_valid
    end

    it 'creates a recipe with ingredients' do
      recipe = create(:recipe, :with_ingredients)
      expect(recipe.ingredients.count).to eq(3)
    end

    it 'creates a recipe with instructions' do
      recipe = create(:recipe, :with_instructions)
      expect(recipe.instructions.count).to eq(3)
    end

    it 'creates a complete recipe' do
      recipe = create(:recipe, :complete)
      expect(recipe.ingredients.count).to eq(3)
      expect(recipe.instructions.count).to eq(3)
    end
  end
end
