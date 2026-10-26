CREATE TABLE `cities` (
	`id` char(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`country_code` char(2) NOT NULL DEFAULT 'MK',
	`lat` decimal(9,6),
	`lng` decimal(9,6),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cities_slug_uq` UNIQUE(`slug`)
);
