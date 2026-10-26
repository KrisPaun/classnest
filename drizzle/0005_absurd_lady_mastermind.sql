CREATE TABLE `listing_stats` (
	`listing_id` char(36) NOT NULL,
	`rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
	`review_count` int NOT NULL DEFAULT 0,
	`booking_count` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `listing_stats_listing_id` PRIMARY KEY(`listing_id`),
	CONSTRAINT `listing_stats_rating_chk` CHECK(`listing_stats`.`rating_avg` between 0 and 5),
	CONSTRAINT `listing_stats_counts_chk` CHECK(`listing_stats`.`review_count` >= 0 and `listing_stats`.`booking_count` >= 0)
);
--> statement-breakpoint
ALTER TABLE `listing_stats` ADD CONSTRAINT `listing_stats_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;