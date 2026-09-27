-- AlterTable
ALTER TABLE `posts`
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `featured_rank` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `posts_status_is_featured_featured_rank_published_at_idx`
    ON `posts`(`status`, `is_featured`, `featured_rank`, `published_at`);
