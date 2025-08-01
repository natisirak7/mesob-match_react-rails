class CreateRecipes < ActiveRecord::Migration[7.0]
  def change
    create_table :recipes do |t|
      t.string :name, limit: 255
      t.string :title, limit: 255
      t.string :category, limit: 50
      t.integer :prep_time
      t.integer :cook_time
      t.integer :servings
      t.string :difficulty, limit: 20
      t.string :cuisine, limit: 50
      t.string :image, limit: 255
      t.text :description
      t.references :author, null: false, foreign_key: { to_table: :users }
      
      t.timestamps
    end
    
    add_index :recipes, :name, unique: true
    add_index :recipes, :category
    # Note: author_id index is automatically created by t.references
  end
end
