-- AlterTable
ALTER TABLE `ai_conversations`
    ADD COLUMN `is_pinned` BOOLEAN NOT NULL DEFAULT false;

-- AddIndex
CREATE INDEX `ai_conversations_visitor_id_is_pinned_updated_at_idx`
    ON `ai_conversations`(`visitor_id`, `is_pinned`, `updated_at`);
