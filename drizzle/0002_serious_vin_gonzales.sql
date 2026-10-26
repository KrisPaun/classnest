CREATE TABLE `account_roles` (
	`account_id` char(36) NOT NULL,
	`role` varchar(16) NOT NULL,
	CONSTRAINT `account_roles_account_id_role_pk` PRIMARY KEY(`account_id`,`role`),
	CONSTRAINT `account_roles_role_chk` CHECK(`account_roles`.`role` in ('HOST', 'GUEST', 'ADMIN'))
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` char(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`full_name` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`email_verified_at` datetime(3),
	`last_login_at` datetime(3),
	`legacy_host_slug` varchar(80),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_email_uq` UNIQUE(`email`),
	CONSTRAINT `accounts_legacy_host_slug_uq` UNIQUE(`legacy_host_slug`),
	CONSTRAINT `accounts_status_chk` CHECK(`accounts`.`status` in ('ACTIVE', 'SUSPENDED', 'DELETED'))
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` char(36) NOT NULL,
	`account_id` char(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`ip` varchar(45),
	`user_agent` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_sessions_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `account_roles` ADD CONSTRAINT `account_roles_account_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_account_fk` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_sessions_account_idx` ON `auth_sessions` (`account_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expires_idx` ON `auth_sessions` (`expires_at`);