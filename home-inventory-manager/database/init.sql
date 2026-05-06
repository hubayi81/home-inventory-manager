-- 家庭库存管理系统 - 数据库初始化脚本

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS family_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE family_inventory;

-- 用户表（最先创建，其他表可能引用它）
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 物品表
CREATE TABLE IF NOT EXISTS items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  category_id INT,
  quantity    INT DEFAULT 1,
  expiry_date DATE NULL,
  notes       TEXT,
  image_path  VARCHAR(255) NULL,
  status      ENUM('in_stock','out_of_stock','missing') DEFAULT 'in_stock',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 购物清单表
CREATE TABLE IF NOT EXISTS shopping_list (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,
  item_id   INT NULL,
  quantity  INT DEFAULT 1,
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 设置表
CREATE TABLE IF NOT EXISTS settings (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  `key`  VARCHAR(50) NOT NULL UNIQUE,
  value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 推送通知订阅表
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  subscription_json TEXT NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预插入默认分类
INSERT INTO categories (name) VALUES
  ('食品'), ('饮料'), ('日用品'), ('药品'), ('零食'), ('其他');

-- 默认设置：提醒天数 = 7
INSERT INTO settings (`key`, value) VALUES ('reminder_days', '7');
