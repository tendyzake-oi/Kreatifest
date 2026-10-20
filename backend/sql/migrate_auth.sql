-- Jalankan pada database Kreatifest yang dibuat sebelum autentikasi ditambahkan.
USE kreatifest;

SET @phone_column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'phone'
);
SET @phone_column_sql = IF(
  @phone_column_exists = 0,
  "ALTER TABLE users ADD COLUMN phone VARCHAR(24) NOT NULL DEFAULT '' AFTER email",
  'SELECT 1'
);
PREPARE phone_column_statement FROM @phone_column_sql;
EXECUTE phone_column_statement;
DEALLOCATE PREPARE phone_column_statement;

SET @session_version_column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'session_version'
);
SET @session_version_column_sql = IF(
  @session_version_column_exists = 0,
  'ALTER TABLE users ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE session_version_column_statement FROM @session_version_column_sql;
EXECUTE session_version_column_statement;
DEALLOCATE PREPARE session_version_column_statement;

SET @last_login_column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login_at'
);
SET @last_login_column_sql = IF(
  @last_login_column_exists = 0,
  'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE last_login_column_statement FROM @last_login_column_sql;
EXECUTE last_login_column_statement;
DEALLOCATE PREPARE last_login_column_statement;

SET @login_count_column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'login_count'
);
SET @login_count_column_sql = IF(
  @login_count_column_exists = 0,
  'ALTER TABLE users ADD COLUMN login_count BIGINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE login_count_column_statement FROM @login_count_column_sql;
EXECUTE login_count_column_statement;
DEALLOCATE PREPARE login_count_column_statement;

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
