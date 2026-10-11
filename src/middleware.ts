import { defineMiddleware } from 'astro:middleware';
import { strings } from './lib/i18n';
import { ensureMigrated } from './lib/migrate';
import { getSite } from './lib/settings';

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	// Photos need neither the database nor the settings.
	if (pathname.startsWith('/img/')) return next();

	await ensureMigrated();
	context.locals.site = await getSite();
	context.locals.t = strings[context.locals.site.lang];

	// Everything under /admin requires a logged-in session, except the login page itself.
	const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
	if (!isAdmin || pathname === '/admin/login') return next();

	if (await context.session?.get('admin')) return next();

	if (pathname.startsWith('/admin/api/')) return new Response('Unauthorized', { status: 401 });
	return context.redirect('/admin/login');
});
