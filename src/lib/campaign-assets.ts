export type CampaignAsset = {
  id: string;
  filename: string;
  type: string;
  detail: string;
  href: string;
  download: string;
};

export function campaignAssets(campaignId: string): CampaignAsset[] {
  return [
    {
      id: "excel",
      filename: "parcels.xlsx",
      type: "Property dataset",
      detail: "Qualified properties, grades, and analysis",
      href: `/api/campaigns/${campaignId}/export`,
      download: "parcels.xlsx",
    },
    {
      id: "before",
      filename: "before_images.zip",
      type: "Satellite imagery",
      detail: "Aerial image for each property",
      href: `/api/campaigns/${campaignId}/export/assets?kind=before`,
      download: "before_images.zip",
    },
    {
      id: "after",
      filename: "after_images.zip",
      type: "Terrace visualizations",
      detail: "Before and after marketing imagery",
      href: `/api/campaigns/${campaignId}/export/assets?kind=after`,
      download: "after_images.zip",
    },
    {
      id: "postcards",
      filename: "postcards.zip",
      type: "Marketing postcards",
      detail: "Personalized postcards with agent contact",
      href: `/api/campaigns/${campaignId}/export/assets?kind=postcards`,
      download: "postcards.zip",
    },
    {
      id: "package",
      filename: "marketing-kit.zip",
      type: "Campaign package",
      detail: "Spreadsheet, postcards, reports, and imagery",
      href: `/api/campaigns/${campaignId}/export/package`,
      download: `campaign_${campaignId}_marketing.zip`,
    },
  ];
}
