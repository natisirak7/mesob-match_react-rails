class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :name, null: false, limit: 100
      t.string :email, null: false, limit: 100
      t.string :password_digest, null: false
      t.string :role, null: false, default: 'author'
      
      t.timestamps
    end
    
    add_index :users, :email, unique: true
    add_check_constraint :users, "role IN ('admin', 'author')", name: 'users_role_check'
  end
end
