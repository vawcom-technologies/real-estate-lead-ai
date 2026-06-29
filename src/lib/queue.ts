import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/redis";

export const CAMPAIGN_QUEUE_NAME = "campaign-processing";

export type CampaignJobData = {
  campaignId: string;
};

let campaignQueue: Queue | undefined;

export function getCampaignQueue() {
  if (!campaignQueue) {
    campaignQueue = new Queue<CampaignJobData>(CAMPAIGN_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 1,
      },
    });
  }

  return campaignQueue;
}

export async function enqueueCampaignJob(campaignId: string) {
  const queue = getCampaignQueue();
  const existing = await queue.getJob(campaignId);

  if (existing) {
    const state = await existing.getState();
    if (state === "active" || state === "waiting" || state === "delayed") {
      return;
    }
    await existing.remove();
  }

  await queue.add(
    "process-campaign",
    { campaignId },
    { jobId: campaignId },
  );
}
