# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_07_31_014719) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "ingredients", force: :cascade do |t|
    t.string "name", limit: 100, null: false
    t.string "category", limit: 50
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_ingredients_on_category"
    t.index ["name"], name: "index_ingredients_on_name", unique: true
    t.check_constraint "category::text = ANY (ARRAY['spices'::character varying, 'vegetables'::character varying, 'meat'::character varying, 'grains'::character varying, 'legumes'::character varying, 'dairy'::character varying, 'oils'::character varying, 'herbs'::character varying, 'fruits'::character varying, 'nuts'::character varying, 'other'::character varying]::text[])", name: "ingredients_category_check"
  end

  create_table "instructions", force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.integer "step_number", null: false
    t.text "description", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["recipe_id", "step_number"], name: "index_instructions_on_recipe_id_and_step_number", unique: true
    t.index ["recipe_id"], name: "index_instructions_on_recipe_id"
  end

  create_table "recipe_ingredients", id: false, force: :cascade do |t|
    t.bigint "recipe_id", null: false
    t.bigint "ingredient_id", null: false
    t.string "quantity", limit: 100
    t.boolean "is_optional", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ingredient_id"], name: "index_recipe_ingredients_on_ingredient_id"
    t.index ["recipe_id", "ingredient_id"], name: "index_recipe_ingredients_on_recipe_id_and_ingredient_id", unique: true
    t.index ["recipe_id"], name: "index_recipe_ingredients_on_recipe_id"
  end

  create_table "recipes", force: :cascade do |t|
    t.string "name", limit: 255
    t.string "title", limit: 255
    t.string "category", limit: 50
    t.integer "prep_time"
    t.integer "cook_time"
    t.integer "servings"
    t.string "difficulty", limit: 20
    t.string "cuisine", limit: 50
    t.string "image", limit: 255
    t.text "description"
    t.bigint "author_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_recipes_on_author_id"
    t.index ["category"], name: "index_recipes_on_category"
    t.index ["name"], name: "index_recipes_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "name", limit: 100, null: false
    t.string "email", limit: 100, null: false
    t.string "password_digest", null: false
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "instructions", "recipes"
  add_foreign_key "recipe_ingredients", "ingredients"
  add_foreign_key "recipe_ingredients", "recipes"
  add_foreign_key "recipes", "users", column: "author_id"
end
