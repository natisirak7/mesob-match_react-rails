FactoryBot.define do
  factory :instruction do
    association :recipe
    step_number { 1 }
    description { Faker::Food.description }

    trait :sequence do
      sequence(:step_number) { |n| n }
    end
  end
end
