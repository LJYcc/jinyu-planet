ALTER TABLE `file_assets`
    ADD COLUMN `extracted_text` LONGTEXT NULL AFTER `checksum`,
    ADD COLUMN `extraction_error` VARCHAR(300) NULL AFTER `extracted_text`;

CREATE TABLE `ai_message_assets` (
    `message_id` CHAR(36) NOT NULL,
    `asset_id` CHAR(36) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,

    PRIMARY KEY (`message_id`, `asset_id`),
    INDEX `ai_message_assets_asset_id_idx`(`asset_id`),
    CONSTRAINT `ai_message_assets_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ai_message_assets_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `file_assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
