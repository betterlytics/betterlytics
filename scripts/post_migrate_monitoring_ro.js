// Stub for a removed script: old betterlytics-selfhost checkouts still call
// this by name. Role provisioning moved to provision_roles.js.
console.error(
  "Your betterlytics-selfhost checkout is outdated for this image.\n" +
    "Run 'git pull' in your betterlytics-selfhost directory, then 'docker compose up -d' again."
);
process.exit(1);
