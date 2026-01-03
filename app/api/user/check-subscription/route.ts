import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 有料プランで、有効期限が切れていないかチェック
    const isPremium = 
      user.subscriptionPlan === "premium" &&
      (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date());

    // 無料ユーザーの分析回数を取得
    let freeAnalysisCount = 0;
    if (!isPremium) {
      const analysisCount = await prisma.analysis.count({
        where: {
          userId: session.user.id,
        },
      });
      freeAnalysisCount = analysisCount;
    }

    return NextResponse.json({
      subscriptionPlan: user.subscriptionPlan,
      isPremium,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      freeAnalysisCount,
      canAnalyze: isPremium || freeAnalysisCount < 3,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

