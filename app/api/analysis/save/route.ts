"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyzePostResult } from "@/app/actions";

export async function saveAnalysis(
  input: {
    platform?: string;
    platformType?: string;
    text: string;
    imageBase64?: string;
    imageMimeType?: string;
    videoBase64?: string;
    videoMimeType?: string;
    impressions?: number;
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    engagementRate?: number;
  },
  result: AnalyzePostResult
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "ログインが必要です" };
  }

  try {
    await prisma.analysis.create({
      data: {
        userId: session.user.id,
        platform: input.platform || null,
        platformType: input.platformType || null,
        postText: input.text,
        imageBase64: input.imageBase64 || null,
        imageMimeType: input.imageMimeType || null,
        videoBase64: input.videoBase64 || null,
        videoMimeType: input.videoMimeType || null,
        impressions: input.impressions || null,
        reach: input.reach || null,
        likes: input.likes || null,
        comments: input.comments || null,
        shares: input.shares || null,
        saves: input.saves || null,
        engagementRate: input.engagementRate || null,
        result: JSON.stringify(result),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving analysis:", error);
    return { error: "分析結果の保存に失敗しました" };
  }
}

