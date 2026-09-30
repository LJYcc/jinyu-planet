-- AlterTable
ALTER TABLE `ai_messages`
    ADD COLUMN `reasoning_content` LONGTEXT NULL AFTER `content`;
