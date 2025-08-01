class CreateIngredients < ActiveRecord::Migration[7.0]
  def change
    create_table :ingredients do |t|
      t.string :name, null: false, limit: 100
      t.string :category, limit: 50
      
      t.timestamps
    end
    
    add_index :ingredients, :name, unique: true
    add_index :ingredients, :category
    add_check_constraint :ingredients, "category IN ('protein', 'vegetable', 'spice', 'grain', 'dairy', 'herb', 'seasoning')", name: 'ingredients_category_check'
  end
end
