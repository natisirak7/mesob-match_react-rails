class UpdateIngredientCategoriesConstraint < ActiveRecord::Migration[8.0]
  def up
    # Remove the old constraint first
    remove_check_constraint :ingredients, name: 'ingredients_category_check'
    
    # Update existing ingredient categories to match new schema
    category_mapping = {
      'protein' => 'meat',
      'vegetable' => 'vegetables', 
      'spice' => 'spices',
      'grain' => 'grains',
      'dairy' => 'dairy',
      'herb' => 'herbs',
      'seasoning' => 'spices'
    }
    
    category_mapping.each do |old_category, new_category|
      execute "UPDATE ingredients SET category = '#{new_category}' WHERE category = '#{old_category}'"
    end
    
    # Add the new constraint with updated categories
    add_check_constraint :ingredients, 
      "category IN ('spices', 'vegetables', 'meat', 'grains', 'legumes', 'dairy', 'oils', 'herbs', 'fruits', 'nuts', 'other')", 
      name: 'ingredients_category_check'
  end

  def down
    # Remove the new constraint
    remove_check_constraint :ingredients, name: 'ingredients_category_check'
    
    # Revert ingredient categories to old schema
    category_mapping = {
      'meat' => 'protein',
      'vegetables' => 'vegetable',
      'spices' => 'spice', 
      'grains' => 'grain',
      'dairy' => 'dairy',
      'herbs' => 'herb'
    }
    
    category_mapping.each do |new_category, old_category|
      execute "UPDATE ingredients SET category = '#{old_category}' WHERE category = '#{new_category}'"
    end
    
    # Restore the old constraint
    add_check_constraint :ingredients, 
      "category IN ('protein', 'vegetable', 'spice', 'grain', 'dairy', 'herb', 'seasoning')", 
      name: 'ingredients_category_check'
  end
end
