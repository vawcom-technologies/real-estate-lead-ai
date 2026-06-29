import "dotenv/config";
import { enqueueCampaignJob } from "../src/lib/queue";

const campaignId = process.argv[2];

if (!campaignId) {
  console.error("Usage: npx tsx scripts/extract-campaign.ts <campaignId>");
  process.exit(1);
}

enqueueCampaignJob(campaignId)
  .then(() => {
    console.log(JSON.stringify({ campaignId, queued: true }, null, 2));
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
