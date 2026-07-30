import nextra from "nextra";
import * as path from "path";
import dotenv from "dotenv";

const withNextra = nextra({});

const rootDir = path.resolve(process.cwd(), "..");
const envPath = path.join(rootDir, ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn("Could not load .env file from root:", result.error.message);
}

// The docs app is served behind a reverse proxy at /docs and /blog, alongside
// the dashboard app on the same origin. Both are Next apps, so an unprefixed
// /_next/* would be ambiguous at the proxy — everything this app owns lives
// under /docs-static/* instead, which the proxy can route unambiguously.
export default withNextra({
  output: "standalone",
  assetPrefix: "/docs-static",
  images: { path: "/docs-static/_next/image" },
});
