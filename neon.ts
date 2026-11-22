import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    // Browser origins allowed to open live queries: the Vercel site plus Vite dev and preview servers.
    realtime: {
      allowedOrigins: [
        "https://pa-cebu-yep.vercel.app",
        "https://pa-cebu-yep-astrotirze-5301.vercel.app",
        "http://localhost:5179", "http://localhost:5173", "http://localhost:4173",
      ],
    },
  },
  auth: true,
  aiGateway: true,
  functions: {
    rsvp: {
      name: "PA Cebu RSVP",
      source: "./functions/rsvp.ts",
      env: {
        REALTIME_SECRET: { value: process.env.NEON_REALTIME_SECRET, required: true },
      },
    },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) return {};
    if (!branch.exists) return { ttl: "7d" };
    return {};
  },
});
