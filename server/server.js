import app from "./app.js";
import { disconnectDB } from "./src/configs/db.config.js";

const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening at port ${process.env.PORT}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));



