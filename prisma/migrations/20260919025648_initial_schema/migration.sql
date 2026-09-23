-- CreateTable
CREATE TABLE `anonymous_visitors` (
    `id` CHAR(36) NOT NULL,
    `nickname` VARCHAR(64) NOT NULL,
    `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_sessions` (
    `id` CHAR(36) NOT NULL,
    `visitor_id` CHAR(36) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `visitor_sessions_token_hash_key`(`token_hash`),
    INDEX `visitor_sessions_visitor_id_expires_at_idx`(`visitor_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(48) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `description` VARCHAR(160) NOT NULL,
    `color_key` VARCHAR(24) NOT NULL DEFAULT 'lime',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `topics_slug_key`(`slug`),
    UNIQUE INDEX `topics_name_key`(`name`),
    INDEX `topics_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `visitor_id` CHAR(36) NOT NULL,
    `topic_id` INTEGER NOT NULL,
    `type` ENUM('article', 'short', 'photo', 'link') NOT NULL,
    `status` ENUM('pending', 'published', 'hidden') NOT NULL DEFAULT 'published',
    `title` VARCHAR(160) NULL,
    `excerpt` VARCHAR(320) NOT NULL,
    `content_html` LONGTEXT NOT NULL,
    `content_text` LONGTEXT NOT NULL,
    `external_url` VARCHAR(2048) NULL,
    `cover_image_id` CHAR(36) NULL,
    `reading_minutes` INTEGER NOT NULL DEFAULT 1,
    `client_nonce` CHAR(36) NOT NULL,
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    INDEX `posts_status_published_at_idx`(`status`, `published_at`),
    INDEX `posts_topic_id_status_published_at_idx`(`topic_id`, `status`, `published_at`),
    INDEX `posts_visitor_id_created_at_idx`(`visitor_id`, `created_at`),
    UNIQUE INDEX `posts_visitor_id_client_nonce_key`(`visitor_id`, `client_nonce`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(48) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_slug_key`(`slug`),
    UNIQUE INDEX `tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tag_links` (
    `post_id` CHAR(36) NOT NULL,
    `tag_id` INTEGER NOT NULL,

    PRIMARY KEY (`post_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_images` (
    `id` CHAR(36) NOT NULL,
    `post_id` CHAR(36) NOT NULL,
    `storage_key` VARCHAR(512) NOT NULL,
    `public_url` VARCHAR(2048) NOT NULL,
    `alt_text` VARCHAR(300) NOT NULL,
    `caption` VARCHAR(500) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `post_images_storage_key_key`(`storage_key`),
    INDEX `post_images_post_id_sort_order_idx`(`post_id`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `visitor_sessions` ADD CONSTRAINT `visitor_sessions_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `anonymous_visitors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `anonymous_visitors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_cover_image_id_fkey` FOREIGN KEY (`cover_image_id`) REFERENCES `post_images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tag_links` ADD CONSTRAINT `post_tag_links_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tag_links` ADD CONSTRAINT `post_tag_links_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_images` ADD CONSTRAINT `post_images_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
