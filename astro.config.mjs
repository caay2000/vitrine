// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // Photos are resized in the browser before upload, so no image service is needed.
  adapter: cloudflare({ imageService: 'passthrough' }),
});
