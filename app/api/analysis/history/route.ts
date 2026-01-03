import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyzePostResult } from "@/app/actions";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analyses = await prisma.analysis.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // 最新50件
    });

    const formattedAnalyses = analyses.map((analysis: (typeof analyses)[0]) => ({
      id: analysis.id,
      platform: analysis.platform,
      platformType: analysis.platformType,
      postText: analysis.postText,
      imageBase64: analysis.imageBase64,
      imageMimeType: analysis.imageMimeType,
      videoBase64: analysis.videoBase64,
      videoMimeType: analysis.videoMimeType,
      impressions: analysis.impressions,
      reach: analysis.reach,
      likes: analysis.likes,
      comments: analysis.comments,
      shares: analysis.shares,
      saves: analysis.saves,
      engagementRate: analysis.engagementRate,
      result: JSON.parse(analysis.result) as AnalyzePostResult,
      createdAt: analysis.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedAnalyses);
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

