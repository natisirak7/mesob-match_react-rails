FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.unique.email }
    password { "password123" }
    role { :author }

    trait :admin do
      role { :admin }
    end

    trait :author do
      role { :author }
    end
  end
end
