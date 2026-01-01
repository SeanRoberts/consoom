declare module "cloudflare:workers" {
  export const env: CloudflareEnv & {
    BETTER_AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
}

interface CloudflareEnv {
  DB: D1Database;
}
