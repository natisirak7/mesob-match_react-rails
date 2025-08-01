class ChangeRoleToIntegerInUsers < ActiveRecord::Migration[8.0]
  def up
    # Remove the old check constraint
    remove_check_constraint :users, name: 'users_role_check'
    
    # Convert existing string values to integers
    # author -> 0, admin -> 1
    execute "UPDATE users SET role = CASE WHEN role = 'author' THEN '0' WHEN role = 'admin' THEN '1' ELSE '0' END"
    
    # Remove the default value first
    change_column_default :users, :role, nil
    
    # Change column type to integer using explicit casting
    execute "ALTER TABLE users ALTER COLUMN role TYPE integer USING role::integer"
    
    # Set the new integer default (0 = author)
    change_column_default :users, :role, 0
  end
  
  def down
    # Convert integers back to strings
    execute "UPDATE users SET role = CASE WHEN role = 0 THEN 'author' WHEN role = 1 THEN 'admin' ELSE 'author' END"
    
    # Change column back to string
    change_column :users, :role, :string, default: 'author', null: false
    
    # Re-add the check constraint
    add_check_constraint :users, "role IN ('admin', 'author')", name: 'users_role_check'
  end
end
