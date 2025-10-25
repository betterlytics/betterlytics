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

export default withNextra({
  output: "standalone",
  basePath: "/docs",
});
