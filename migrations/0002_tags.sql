CREATE TABLE item_tags (
	item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
	-- slug identifies the tag (used in URLs); name is how it is displayed
	slug TEXT NOT NULL,
	name TEXT NOT NULL,
	PRIMARY KEY (item_id, slug)
);

CREATE INDEX item_tags_slug ON item_tags (slug);
