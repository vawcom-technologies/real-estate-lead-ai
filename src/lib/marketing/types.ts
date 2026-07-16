export type MarketingCampaign = {
  id: string;
  postcode: string;
  min_price: { toString(): string } | number;
  agent_name: string;
  agent_phone: string;
  agent_email: string;
  created_at: Date;
};

export type MarketingParcel = {
  department: string;
  municipality: string;
  section: string;
  parcel_number: string;
  sale_price: { toString(): string } | number | null;
  sale_date: Date | null;
  address: string | null;
  house_area: { toString(): string } | number | null;
  plot_area: { toString(): string } | number | null;
  grade: string | null;
  reason: string | null;
  analysis: string | null;
};

export type ParsedAnalysis = {
  free_backyard_area?: string;
  terrain_slope?: string;
  vegetation_density?: string;
  terrace_feasibility?: string;
  summary?: string;
};

export type MarketingContext = {
  campaign: MarketingCampaign;
  parcels: MarketingParcel[];
};
