-- AlterTable
ALTER TABLE `ai_messages`
    ADD COLUMN `reasoning_duration_ms` INT NULL AFTER `reasoning_content`;
