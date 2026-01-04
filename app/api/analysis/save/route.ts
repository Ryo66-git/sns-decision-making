import { NextResponse } from "next/server";

// このAPIルートは使用されていません
// saveAnalysisは app/actions.ts のサーバーアクションとして実装されています
export async function POST() {
  return NextResponse.json(
    { error: "このエンドポイントは使用されていません。サーバーアクションを使用してください。" },
    { status: 404 }
  );
}

