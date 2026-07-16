import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import {
  detectPropertyImageMimeType,
  getPropertyImagePath,
} from "@/lib/satellite-imagery";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parcelId = decodeURIComponent(id);

  try {
    const buffer = await readFile(getPropertyImagePath(parcelId));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": detectPropertyImageMimeType(buffer),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
