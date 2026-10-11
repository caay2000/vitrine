import { env } from 'cloudflare:workers';

// The SQL files in /migrations, bundled with the app so a deployed site can bring its own database up to date.
const files = import.meta.glob<string>('../../migrations/*.sql', { query: '?raw', import: 'default', eager: true });

const migrations = Object.entries(files)
	.map(([path, sql]) => ({ name: path.split('/').pop()!, sql }))
	.sort((a, b) => a.name.localeCompare(b.name));

function statements(sql: string): string[] {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n')
		.split(';')
		.map((statement) => statement.trim())
		.filter(Boolean);
}

async function migrate(): Promise<void> {
	// Same table `wrangler d1 migrations apply` uses, so both ways of migrating agree on what is applied.
	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS d1_migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
		)`,
	).run();
	const applied = async () => {
		const { results } = await env.DB.prepare('SELECT name FROM d1_migrations').all<{ name: string }>();
		return new Set(results.map((row) => row.name));
	};

	const done = await applied();
	for (const migration of migrations) {
		if (done.has(migration.name)) continue;
		try {
			// One transaction per migration. Recording it first makes a concurrent run fail on the
			// unique name before it repeats any of the statements.
			await env.DB.batch([
				env.DB.prepare('INSERT INTO d1_migrations (name) VALUES (?)').bind(migration.name),
				...statements(migration.sql).map((statement) => env.DB.prepare(statement)),
			]);
		} catch (error) {
			if (!(await applied()).has(migration.name)) throw error;
		}
	}
}

let ready: Promise<void> | undefined;

// Applies pending migrations once per worker instance; later calls reuse the result.
export function ensureMigrated(): Promise<void> {
	ready ??= migrate().catch((error) => {
		ready = undefined;
		throw error;
	});
	return ready;
}
