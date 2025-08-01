class CreateRecipeIngredients < ActiveRecord::Migration[7.0]
  def change
    create_table :recipe_ingredients, id: false do |t|
      t.references :recipe, null: false, foreign_key: true
      t.references :ingredient, null: false, foreign_key: true
      t.string :quantity, limit: 100
      t.boolean :is_optional, default: false
      
      t.timestamps
    end
    
    add_index :recipe_ingredients, [:recipe_id, :ingredient_id], unique: true
    # Note: recipe_id and ingredient_id indexes are automatically created by t.references
  end
end
