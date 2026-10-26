CREATE TABLE `categories` (
	`id` char(36) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`emoji` varchar(16),
	`parent_id` char(36),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` char(36) NOT NULL,
	`actor_account_id` char(36),
	`action` varchar(64) NOT NULL,
	`entity_type` varchar(64) NOT NULL,
	`entity_id` char(36),
	`diff` json,
	`ip` varchar(45),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`scope` varchar(64) NOT NULL,
	`idempotency_key` varchar(128) NOT NULL,
	`request_hash` char(64) NOT NULL,
	`response_status` int,
	`response_body` json,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `idempotency_keys_scope_idempotency_key_pk` PRIMARY KEY(`scope`,`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` char(36) NOT NULL,
	`aggregate_type` varchar(64) NOT NULL,
	`aggregate_id` char(36) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`payload` json NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`next_attempt_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`processed_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `outbox_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_log` (`actor_account_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idempotency_created_idx` ON `idempotency_keys` (`created_at`);--> statement-breakpoint
CREATE INDEX `outbox_pending_idx` ON `outbox_events` (`processed_at`,`next_attempt_at`);