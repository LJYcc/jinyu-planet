ALTER TABLE `ai_messages`
    ADD COLUMN `search_sources` LONGTEXT NULL AFTER `reasoning_duration_ms`;
