-- Schema awal Kreatifest untuk TiDB (kompatibel dengan MySQL).
CREATE DATABASE IF NOT EXISTS kreatifest
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kreatifest;
--
-- password_hash harus berisi hash Argon2id atau bcrypt yang dibuat di backend.
-- Jangan menyimpan kata sandi mentah atau menggunakan hash contoh.
-- Setelah akun admin dibuat melalui backend, berikan peran admin secara manual:
-- UPDATE users SET role = 'admin' WHERE email = 'email-admin-anda';

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(24) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  session_version INT UNSIGNED NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  login_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_created (role, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_setup_state (
  id TINYINT UNSIGNED NOT NULL,
  setup_complete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO admin_setup_state (id, setup_complete) VALUES (1, FALSE);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  email VARCHAR(254) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_events_logged_at (logged_at),
  KEY idx_login_events_user_logged (user_id, logged_at),
  KEY idx_login_events_email_logged (email, logged_at),
  CONSTRAINT fk_login_events_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
