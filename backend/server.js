require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const connect = require("./db/db");
const app = require("./app");
let server;
async function start() {
  if (!process.env.URI || !process.env.JWT_SECRET) throw new Error("URI and JWT_SECRET are required.");
  await connect();
  // Ensure checkout deduplication is available before accepting orders.
  await Promise.all([require("./models/OrderModel").init(), require("./models/User").init()]);
  server = app.listen(process.env.PORT || 3102, "0.0.0.0", () => console.log("Food Mania API is ready."));
}
async function stop() {
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  clearTimeout(timer);
  process.exit(0);
}
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
start().catch(async error => {
  console.error("API startup failed. Check database connectivity, indexes, URI and JWT_SECRET.", { type: error.name, code: error.code });
  await mongoose.disconnect();
  process.exitCode = 1;
});
