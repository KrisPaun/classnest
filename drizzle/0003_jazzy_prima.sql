CREATE TABLE `host_private_details` (
	`host_id` char(36) NOT NULL,
	`phone_enc` varchar(600),
	`date_of_birth_enc` varchar(600),
	`tax_number` varchar(13),
	`vat_registered` boolean,
	`key_id` varchar(32) NOT NULL DEFAULT 'env-v1',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `host_private_details_host_id` PRIMARY KEY(`host_id`)
);
--> statement-breakpoint
CREATE TABLE `host_settings` (
	`host_id` char(36) NOT NULL,
	`trading_name` varchar(100) NOT NULL,
	`one_public_booking_at_a_time` boolean NOT NULL DEFAULT false,
	`allow_self_service_changes` boolean NOT NULL DEFAULT false,
	`allow_promo_use` boolean NOT NULL DEFAULT false,
	`payout_frequency` varchar(16) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `host_settings_host_id` PRIMARY KEY(`host_id`),
	CONSTRAINT `host_settings_frequency_chk` CHECK(`host_settings`.`payout_frequency` in ('weekly', 'biweekly', 'monthly'))
);
--> statement-breakpoint
CREATE TABLE `hosts` (
	`id` char(36) NOT NULL,
	`account_id` char(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`display_name` varchar(100) NOT NULL,
	`business_name` varchar(100),
	`city_id` char(36) NOT NULL,
	`category_id` char(36),
	`short_bio` text NOT NULL,
	`story` text,
	`started_month` smallint,
	`started_year` smallint,
	`website_url` varchar(255),
	`instagram_url` varchar(255),
	`facebook_url` varchar(255),
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`profile_completed_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `hosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `hosts_slug_uq` UNIQUE(`slug`),
	CONSTRAINT `hosts_account_uq` UNIQUE(`account_id`),
	CONSTRAINT `hosts_status_chk` CHECK(`hosts`.`status` in ('PENDING', 'ACTIVE', 'SUSPENDED'))
);
--> statement-breakpoint
CREATE TABLE `payout_accounts` (
	`id` char(36) NOT NULL,
	`host_id` char(36) NOT NULL,
	`bank_name` varchar(80) NOT NULL,
	`holder_name` varchar(100) NOT NULL,
	`iban_enc` varchar(600) NOT NULL,
	`iban_last4` char(4) NOT NULL,
	`key_id` varchar(32) NOT NULL DEFAULT 'env-v1',
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`verified_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `payout_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `payout_accounts_host_uq` UNIQUE(`host_id`),
	CONSTRAINT `payout_accounts_status_chk` CHECK(`payout_accounts`.`status` in ('ACTIVE', 'DISABLED'))
);
--> statement-breakpoint
ALTER TABLE `host_private_details` ADD CONSTRAINT `host_private_host_fk` FOREIGN KEY (`host_id`) REFERENCES `hosts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `host_settings` ADD CONSTRAINT `host_settings_host_fk` FOREIGN KEY (`host_id`) REFERENCES `hosts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hosts` ADD CONSTRAINT `hosts_account_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hosts` ADD CONSTRAINT `hosts_city_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hosts` ADD CONSTRAINT `hosts_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payout_accounts` ADD CONSTRAINT `payout_accounts_host_fk` FOREIGN KEY (`host_id`) REFERENCES `hosts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `hosts_city_idx` ON `hosts` (`city_id`);