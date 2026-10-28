import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { workspaceAerialUrl } from "@/lib/demo-workspace";
import {
  detectPropertyImageMimeType,
  getPropertyImagePath,
} from "@/lib/satellite-imagery";
import { getAfterImagePath } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parcelId = decodeURIComponent(id);
  const variant = new URL(request.url).searchParams.get("variant");
  const imagePath =
    variant === "after"
      ? getAfterImagePath(parcelId)
      : getPropertyImagePath(parcelId);

  try {
    const buffer = await readFile(imagePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": detectPropertyImageMimeType(buffer),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    const aerial = workspaceAerialUrl(parcelId);
    if (!aerial) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    try {
      const response = await fetch(aerial);
      if (!response.ok) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
  }
}
