-- Folded (lowercase, accent-free) copy of the title, field values and tag names, used by the admin search.
-- Kept up to date by the app on every save; existing rows get an approximation until they are next saved.
ALTER TABLE items ADD COLUMN search TEXT NOT NULL DEFAULT '';

UPDATE items SET search = lower(title || ' ' || fields);
