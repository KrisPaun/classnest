ALTER TABLE `listings` DROP CONSTRAINT `listings_status_chk`;--> statement-breakpoint
ALTER TABLE `listings` ADD `moderation_note` varchar(500);--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_status_chk` CHECK (`listings`.`status` in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'HIDDEN_TEMPORARY', 'HIDDEN_PERMANENT', 'REJECTED', 'TAKEN_DOWN'));