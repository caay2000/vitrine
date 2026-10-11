import { defineMiddleware } from 'astro:middleware';

// Everything under /admin requires a logged-in session, except the login page itself.
export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
	if (!isAdmin || pathname === '/admin/login') return next();

	if (await context.session?.get('admin')) return next();

	if (pathname.startsWith('/admin/api/')) return new Response('Unauthorized', { status: 401 });
	return context.redirect('/admin/login');
});
