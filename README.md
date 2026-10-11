# Vitrine

Simple self-hosted gallery for collectors. Catalogue your items with photos, history, origin and prices. Runs for free on Cloudflare.

- Public gallery with one page per item, tags to filter by, and previous/next navigation between items.
- Password-protected admin panel to create items and upload photos, usable from a phone.
- Photos are resized and converted to WebP in the browser before upload, so storage stays small.
- The fields of an item (description, history, price…) are yours to define in one config file.

Built with [Astro](https://astro.build) on Cloudflare Workers, with D1 for the data and R2 for the photos.

## Make it yours

Edit [`vitrine.config.ts`](vitrine.config.ts): site title, description, interface language (`en`, `es`, `ca`) and the list of fields each item has. Fields marked `private: true` are only visible in the admin panel.

## Local development

Requires Node 22.12 or newer.

```sh
npm install
cp .dev.vars.example .dev.vars   # sets the local admin password
npm run db:migrate:local
npm run dev
```

The site is at http://localhost:4321 and the admin panel at http://localhost:4321/admin. Local data lives in `.wrangler/`.

## Deploy

You need a Cloudflare account with R2 enabled.

```sh
npx wrangler login
npm run deploy
npm run db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD
```

To run several collections from the same code, give each one its own `name`, `database_name` and `bucket_name` in [`wrangler.jsonc`](wrangler.jsonc).

## License

[MIT](LICENSE)
