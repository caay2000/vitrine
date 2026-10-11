declare namespace App {
	interface SessionData {
		admin: boolean;
	}

	// Set by the middleware on every page request.
	interface Locals {
		site: import('./lib/settings').Site;
		t: import('./lib/i18n').Strings;
	}
}
