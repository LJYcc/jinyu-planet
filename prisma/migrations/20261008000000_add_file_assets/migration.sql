CREATE TABLE `file_assets` (
    `id` CHAR(36) NOT NULL,
    `visitor_id` CHAR(36) NOT NULL,
    `purpose` VARCHAR(32) NOT NULL,
    `status` ENUM('uploaded', 'processing', 'ready', 'failed') NOT NULL DEFAULT 'uploaded',
    `storage_key` VARCHAR(512) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(120) NOT NULL,
    `size_bytes` INT NOT NULL,
    `checksum` CHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `file_assets_storage_key_key`(`storage_key`),
    INDEX `file_assets_visitor_id_purpose_created_at_idx`(`visitor_id`, `purpose`, `created_at`),
    PRIMARY KEY (`id`),
    CONSTRAINT `file_assets_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `anonymous_visitors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
