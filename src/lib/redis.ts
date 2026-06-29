import type { ConnectionOptions } from "bullmq";

export function getRedisConnection(): ConnectionOptions {
  return {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
    maxRetriesPerRequest: null,
  };
}
