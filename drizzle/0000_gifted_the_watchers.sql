CREATE TABLE `content_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`cover_url` text,
	`attachment_url` text,
	`event_date` text,
	`location` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`owner_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_items_slug_unique` ON `content_items` (`slug`);--> statement-breakpoint
CREATE INDEX `content_items_type_status_idx` ON `content_items` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `content_items_published_at_idx` ON `content_items` (`published_at`);--> statement-breakpoint
CREATE TABLE `media_files` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`alt_text` text DEFAULT '' NOT NULL,
	`size` integer NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_files_storage_key_unique` ON `media_files` (`storage_key`);