FactoryBot.define do
  factory :recipe_ingredient do
    association :recipe
    association :ingredient
    quantity { "#{rand(1..5)} #{%w[cups tbsp tsp lbs oz].sample}" }
    is_optional { false }

    trait :optional do
      is_optional { true }
    end
  end
end
