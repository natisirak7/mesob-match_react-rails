class User < ApplicationRecord
  has_secure_password

  has_many :recipes, foreign_key: 'author_id', dependent: :destroy

  # Define enum first so it can be referenced in validations
  enum :role, { author: 0, admin: 1 }

  validates :name, presence: true, length: { maximum: 100 }
  validates :email, presence: true, uniqueness: true, length: { maximum: 100 }

  before_validation :set_default_role

  # These methods are automatically created by enum, but we can override if needed
  # admin? and author? are already provided by the enum

  private

  def set_default_role
    self.role ||= :author
  end
end
