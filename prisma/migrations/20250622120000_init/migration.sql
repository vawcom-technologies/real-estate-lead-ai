-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "min_price" DECIMAL(12,2) NOT NULL,
    "agent_name" TEXT NOT NULL,
    "agent_phone" TEXT NOT NULL,
    "agent_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcels" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "parcel_number" TEXT NOT NULL,
    "sale_price" DECIMAL(12,2),
    "sale_date" TIMESTAMP(3),
    "address" TEXT,
    "house_area" DECIMAL(10,2),
    "plot_area" DECIMAL(10,2),
    "grade" TEXT,

    CONSTRAINT "Parcels_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Parcels" ADD CONSTRAINT "Parcels_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
