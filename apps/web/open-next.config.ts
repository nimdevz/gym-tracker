import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Uncomment to enable R2 cache for ISR/fetch responses:
  // incrementalCache: r2IncrementalCache,
});
