"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CAMPAIGN_STATUS } from "@/lib/campaign-status";
import { prisma } from "@/lib/prisma";
import { enqueueCampaignJob } from "@/lib/queue";

const campaignSchema = z.object({
  postcode: z.string().trim().min(1, "Postcode is required"),
  min_price: z.coerce.number().positive("Minimum price must be greater than zero"),
  agent_name: z.string().trim().min(1, "Agent name is required"),
  agent_phone: z.string().trim().min(1, "Phone is required"),
  agent_email: z.string().trim().email("Enter a valid email address"),
});

export type CreateCampaignState = {
  success?: boolean;
  campaignId?: string;
  status?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createCampaign(
  _prevState: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  const parsed = campaignSchema.safeParse({
    postcode: formData.get("postcode"),
    min_price: formData.get("min_price"),
    agent_name: formData.get("agent_name"),
    agent_phone: formData.get("agent_phone"),
    agent_email: formData.get("agent_email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        postcode: parsed.data.postcode,
        min_price: parsed.data.min_price,
        agent_name: parsed.data.agent_name,
        agent_phone: parsed.data.agent_phone,
        agent_email: parsed.data.agent_email,
        status: CAMPAIGN_STATUS.pending,
      },
    });

    try {
      await enqueueCampaignJob(campaign.id);
    } catch {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: CAMPAIGN_STATUS.failed },
      });
      return {
        error:
          "Campaign created but could not be queued. Make sure Redis is running.",
      };
    }

    revalidatePath("/");
    return {
      success: true,
      campaignId: campaign.id,
      status: campaign.status,
    };
  } catch {
    return { error: "Unable to create campaign. Please try again." };
  }
}
