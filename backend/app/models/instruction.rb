class Instruction < ApplicationRecord
  belongs_to :recipe
  
  validates :step_number, presence: true, uniqueness: { scope: :recipe_id }
  validates :description, presence: true
  
  scope :ordered, -> { order(:step_number) }
  
  def to_s
    "Step #{step_number}: #{description}"
  end
end
