CREATE TABLE items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	-- JSON object keyed by the field keys declared in vitrine.config.ts
	fields TEXT NOT NULL DEFAULT '{}',
	published INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE photos (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	-- R2 object keys
	key TEXT NOT NULL,
	thumb_key TEXT NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	position INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX photos_item_position ON photos (item_id, position, id);
