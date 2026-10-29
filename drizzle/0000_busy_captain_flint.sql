CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`day` integer NOT NULL,
	`author` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_day_created` ON `notes` (`day`,`created_at`);