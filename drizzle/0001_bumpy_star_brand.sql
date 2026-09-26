CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inquiries_status_created_idx` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `inquiry_rate_limits` (
	`fingerprint` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inquiry_rate_limits_window_idx` ON `inquiry_rate_limits` (`window_start`);--> statement-breakpoint
ALTER TABLE `content_items` ADD `cover_alt` text DEFAULT '' NOT NULL;