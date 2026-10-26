CREATE TABLE `availability_slots` (
	`id` char(36) NOT NULL,
	`listing_id` char(36) NOT NULL,
	`weekday` smallint NOT NULL,
	`start_minute` smallint NOT NULL,
	`end_minute` smallint NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `availability_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `availability_slots_weekday_chk` CHECK(`availability_slots`.`weekday` between 1 and 7),
	CONSTRAINT `availability_slots_time_chk` CHECK(`availability_slots`.`start_minute` >= 0 and `availability_slots`.`end_minute` <= 1440 and `availability_slots`.`start_minute` < `availability_slots`.`end_minute`)
);
--> statement-breakpoint
CREATE TABLE `listing_availability_settings` (
	`listing_id` char(36) NOT NULL,
	`flexibility` varchar(16) NOT NULL,
	`allow_parallel_private_bookings` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `listing_availability_settings_listing_id` PRIMARY KEY(`listing_id`),
	CONSTRAINT `listing_availability_flexibility_chk` CHECK(`listing_availability_settings`.`flexibility` in ('flexible', 'strict'))
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` char(36) NOT NULL,
	`host_id` char(36) NOT NULL,
	`type` varchar(16) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(100) NOT NULL,
	`category_id` char(36) NOT NULL,
	`description` text NOT NULL,
	`price_minor` bigint NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'MKD',
	`duration_minutes` int,
	`max_participants` int,
	`city_id` char(36),
	`address_line` varchar(150),
	`mask_location` boolean NOT NULL DEFAULT false,
	`online_platform` varchar(60),
	`fulfilment` varchar(16),
	`cancellation_mode` varchar(16),
	`cancellation_days` smallint,
	`status` varchar(24) NOT NULL DEFAULT 'IN_REVIEW',
	`published_at` datetime(3),
	`version` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `listings_slug_uq` UNIQUE(`slug`),
	CONSTRAINT `listings_type_chk` CHECK(`listings`.`type` in ('class', 'food', 'experience', 'product', 'online')),
	CONSTRAINT `listings_status_chk` CHECK(`listings`.`status` in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'HIDDEN_TEMPORARY', 'HIDDEN_PERMANENT', 'REJECTED')),
	CONSTRAINT `listings_price_chk` CHECK(`listings`.`price_minor` > 0),
	CONSTRAINT `listings_sessions_chk` CHECK(`listings`.`type` = 'product' or (`listings`.`duration_minutes` is not null and `listings`.`max_participants` is not null)),
	CONSTRAINT `listings_in_person_chk` CHECK(`listings`.`type` not in ('class', 'food', 'experience') or (`listings`.`city_id` is not null and `listings`.`address_line` is not null)),
	CONSTRAINT `listings_fulfilment_chk` CHECK(`listings`.`type` <> 'product' or `listings`.`fulfilment` is not null),
	CONSTRAINT `listings_cancellation_chk` CHECK(`listings`.`cancellation_mode` is null or `listings`.`cancellation_mode` in ('flexible', 'reschedule', 'none'))
);
--> statement-breakpoint
ALTER TABLE `availability_slots` ADD CONSTRAINT `availability_slots_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_availability_settings` ADD CONSTRAINT `listing_availability_listing_fk` FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_host_fk` FOREIGN KEY (`host_id`) REFERENCES `hosts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_city_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `availability_slots_listing_idx` ON `availability_slots` (`listing_id`,`weekday`);--> statement-breakpoint
CREATE INDEX `listings_host_idx` ON `listings` (`host_id`);--> statement-breakpoint
CREATE INDEX `listings_browse_idx` ON `listings` (`status`,`city_id`,`category_id`);