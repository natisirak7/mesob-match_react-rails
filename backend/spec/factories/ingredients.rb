FactoryBot.define do
  factory :ingredient do
    sequence(:name) { |n| "#{Faker::Food.ingredient}_#{n}" }
    # Use updated plural categories to satisfy DB constraint
    category { %w[meat vegetables spices grains dairy].sample }

    trait :protein do
      # Map old trait name to new allowed category
      category { 'meat' }
      sequence(:name) { |n| %w[Beef Chicken Lamb Fish Eggs Lentils].sample + "_#{n}" }
    end

    trait :vegetable do
      category { 'vegetables' }
      sequence(:name) { |n| %w[Onions Tomatoes Garlic Ginger Cabbage Carrots].sample + "_#{n}" }
    end

    trait :spice do
      category { 'spices' }
      name { %w[Berbere Mitmita Cardamom Coriander Cumin Turmeric].sample }
    end
  end
end
