// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // Photos are resized in the browser before upload, so no image service is needed.
  adapter: cloudflare({
    imageService: 'passthrough',
    // Deploy the same code as another site by pointing this at that site's Wrangler config file.
    configPath: process.env.VITRINE_WRANGLER_CONFIG,
  }),
});
