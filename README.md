# Vitrine

Simple self-hosted gallery for collectors. Catalogue your items with photos, history, origin and prices. Runs for free on Cloudflare.

- Public gallery with one page per item, tags to filter by, and previous/next navigation between items.
- Password-protected admin panel to create items and upload photos, usable from a phone.
- Photos are resized and converted to WebP in the browser before upload, so storage stays small.
- Everything about your collection is set from the admin panel: title, language (English, Spanish or Catalan) and the fields each item has (description, history, price…). No code to edit.

Built with [Astro](https://astro.build) on Cloudflare Workers, with D1 for the data and R2 for the photos.

## Get your own

You need a free [Cloudflare](https://dash.cloudflare.com/sign-up) account with R2 enabled (R2 asks for a payment card, but the first 10 GB are free).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/caay2000/vitrine)

The button copies this repository to your GitHub account, creates the database and the photo bucket, asks you for the admin password and publishes the site. Then:

1. Open `/admin` on your new site and log in with the password you chose.
2. Open the menu, go to **Settings**, and set the title, language and fields of your collection.
3. Start adding items.

The database sets itself up, and updates itself when a new version adds something to it.

### From the command line

```sh
git clone https://github.com/caay2000/vitrine.git && cd vitrine
npm install
npx wrangler login
npm run deploy
npx wrangler secret put ADMIN_PASSWORD
```

To publish several collections from the same copy of the code, give each one its own Wrangler config file (copy [`wrangler.jsonc`](wrangler.jsonc) and change `name`, `database_name` and `bucket_name`) and point to it when deploying:

```sh
VITRINE_WRANGLER_CONFIG=/path/to/other-site/wrangler.jsonc npm run deploy
```

## Local development

Requires Node 22.12 or newer.

```sh
npm install
cp .dev.vars.example .dev.vars   # sets the local admin password
npm run dev
```

The site is at http://localhost:4321 and the admin panel at http://localhost:4321/admin. Local data lives in `.wrangler/`.

Database changes go in [`migrations/`](migrations) as numbered SQL files; the app applies the pending ones on its own when it starts.

## License

[MIT](LICENSE)
