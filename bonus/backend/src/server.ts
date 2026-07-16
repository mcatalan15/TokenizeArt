import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config";
import { mintRoutes } from "./routes/mint";

const app = Fastify({ logger: true });

// safeMint is paid for by the deployer's own key (see chain.ts) on every
// call — this caps how much gas an anonymous visitor can force it to spend.
await app.register(rateLimit, { max: 5, timeWindow: "1 minute" });

await app.register(mintRoutes);

app.get("/api/health", async () => ({ status: "ok" }));

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
