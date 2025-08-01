class CreateInstructions < ActiveRecord::Migration[7.0]
  def change
    create_table :instructions do |t|
      t.references :recipe, null: false, foreign_key: true
      t.integer :step_number, null: false
      t.text :description, null: false
      
      t.timestamps
    end
    
    add_index :instructions, [:recipe_id, :step_number], unique: true
    # Note: recipe_id index is automatically created by t.references
  end
end
