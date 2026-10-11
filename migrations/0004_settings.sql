-- Site-wide settings edited from the admin panel. One row per setting, value stored as JSON.
CREATE TABLE settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL
);
