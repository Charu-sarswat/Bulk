-- SQL Schema for QR Restaurant Ordering & Management System

-- Drop tables if they exist (for easy resetting/seeding)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS tables CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Users Table (for Admin/Staff Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff', -- 'admin', 'staff', 'kitchen'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    stock_quantity INT DEFAULT 50 CHECK (stock_quantity >= 0),
    min_stock_level INT DEFAULT 10 CHECK (min_stock_level >= 0),
    daily_prepared_quantity INT DEFAULT 0 CHECK (daily_prepared_quantity >= 0),
    unit VARCHAR(20) DEFAULT 'servings',
    auto_out_of_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Logs / Audit Trail Table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
    change_type VARCHAR(30) NOT NULL, -- 'STOCK_ADD', 'STOCK_SET', 'DAILY_PREPARED', 'ORDER_DEDUCT', 'RESTOCK', 'WASTAGE'
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason TEXT,
    recorded_by VARCHAR(50) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tables Table
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    capacity INT DEFAULT 4 CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'vacant', -- 'vacant', 'occupied'
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    table_id INT REFERENCES tables(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'received', -- 'received', 'preparing', 'ready', 'served', 'cancelled'
    payment_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_method VARCHAR(20) DEFAULT 'counter', -- 'counter' (Pay at Counter), 'online'
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    notes TEXT, -- Individual item customization instructions (e.g. \"No onions\")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- NOTE: Seed data is handled by db.js which checks counts before inserting.
-- schema.sql is structural only — safe to re-run on every server restart.
