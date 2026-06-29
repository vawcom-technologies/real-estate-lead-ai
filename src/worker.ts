import "dotenv/config";
import { Worker } from "bullmq";
import { processCampaignJob } from "@/lib/campaign-processor";
import {
  CAMPAIGN_QUEUE_NAME,
  type CampaignJobData,
} from "@/lib/queue";
import { getRedisConnection } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

async function verifyConnections() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Postgres connected");
}

const worker = new Worker<CampaignJobData>(
  CAMPAIGN_QUEUE_NAME,
  async (job) => {
    console.log(`Processing campaign ${job.data.campaignId}`);
    const result = await processCampaignJob(job.data.campaignId);
    console.log(
      `Campaign ${job.data.campaignId} completed (${result.parcelsStored} parcels kept, ${result.parcelsRejected ?? 0} rejected, ${result.imagesRetrieved ?? 0} images, ${result.visionAnalyzed ?? 0} vision analyzed, grades A/B/C: ${result.grades?.A ?? 0}/${result.grades?.B ?? 0}/${result.grades?.C ?? 0})`,
    );
    return result;
  },
  { connection: getRedisConnection() },
);

worker.on("failed", (job, error) => {
  console.error(`Campaign ${job?.data.campaignId ?? "unknown"} failed`, error);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} finished`);
});

verifyConnections()
  .then(() => {
    console.log(`Worker listening on queue "${CAMPAIGN_QUEUE_NAME}"`);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "Worker startup failed. Run `docker compose up -d` and check DATABASE_URL / REDIS_URL in .env",
    );
    console.error(message);
    process.exit(1);
  });
