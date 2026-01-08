-- MySQL Database Setup for Food Expiry App
-- Run this script in phpMyAdmin to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS foodexpiry;
USE foodexpiry;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supabase_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subscription_type ENUM('free', 'family') DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL -- For local authentication
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Group memberships table
CREATE TABLE IF NOT EXISTS group_memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  translation_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  translation_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Food items table
CREATE TABLE IF NOT EXISTS food_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  category_id INT,
  location_id INT,
  expiry_date DATE NOT NULL,
  reminder_days INT NOT NULL DEFAULT 3,
  notes TEXT,
  image_uri TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  group_id INT,
  cloud_id VARCHAR(255) UNIQUE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Shopping items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_uri TEXT,
  done BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  group_id INT,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Wish items table
CREATE TABLE IF NOT EXISTS wish_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  notes TEXT,
  quantity INT,
  price DECIMAL(10,2),
  rating INT,
  done BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  group_id INT,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_food_items_expiry ON food_items(expiry_date);
CREATE INDEX idx_food_items_category ON food_items(category_id);
CREATE INDEX idx_food_items_location ON food_items(location_id);
CREATE INDEX idx_food_items_group ON food_items(group_id);
CREATE INDEX idx_shopping_items_done ON shopping_items(done);
CREATE INDEX idx_wish_items_done ON wish_items(done);
CREATE INDEX idx_shopping_items_group ON shopping_items(group_id);
CREATE INDEX idx_wish_items_group ON wish_items(group_id);

-- Insert default categories
INSERT INTO categories (name, icon, translation_key) VALUES
('Vegetables', '🥬', 'category.vegetables'),
('Fruits', '🍎', 'category.fruits'),
('Dairy', '🥛', 'category.dairy'),
('Meat', '🥩', 'category.meat'),
('Snacks', '🍿', 'category.snacks'),
('Desserts', '🍰', 'category.desserts'),
('Seafood', '🐟', 'category.seafood'),
('Bread', '🍞', 'category.bread');

-- Insert default locations
INSERT INTO locations (name, icon, translation_key) VALUES
('Fridge', '❄️', 'defaultLocation.fridge'),
('Freezer', '🧊', 'defaultLocation.freezer'),
('Pantry', '🏠', 'defaultLocation.pantry'),
('Counter', '📦', 'defaultLocation.counter');
