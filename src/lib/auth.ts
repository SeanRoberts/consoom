import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "../db";
import * as schema from "../db/schema";

export function createAuth(
  env: CloudflareEnv & {
    BETTER_AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  }
) {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3007",
      "http://localhost:3008",
      "http://localhost:3009",
      "http://localhost:5173",
      // Add production URL when deploying
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
