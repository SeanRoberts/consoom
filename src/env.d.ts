interface CloudflareEnv {
  DB: D1Database;
}

declare module "vinxi/http" {
  interface H3EventContext {
    cf: { env: CloudflareEnv };
  }
}
