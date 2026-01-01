import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: DrizzleD1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
