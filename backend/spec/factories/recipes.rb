FactoryBot.define do
  factory :recipe do
    association :author, factory: :user
    sequence(:name) { |n| "test_recipe_#{n}" }
    title { Faker::Food.dish }
    description { Faker::Food.description }
    category { %w[appetizer main_course dessert vegetarian].sample }
    prep_time { rand(10..60) }
    cook_time { rand(15..120) }
    servings { rand(2..8) }
    difficulty { %w[easy medium hard].sample }
    cuisine { 'Ethiopian' }

    trait :with_ingredients do
      after(:create) do |recipe|
        ingredients = create_list(:ingredient, 3)
        ingredients.each do |ingredient|
          create(:recipe_ingredient, recipe: recipe, ingredient: ingredient)
        end
      end
    end

    trait :with_instructions do
      after(:create) do |recipe|
        3.times do |i|
          create(:instruction, recipe: recipe, step_number: i + 1)
        end
      end
    end

    trait :complete do
      with_ingredients
      with_instructions
    end
  end
end
