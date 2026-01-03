"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen dashboard-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all inline-block mb-4"
          >
            ← 分析に戻る
          </Link>
          <h1 className="luxury-title text-3xl text-white mb-2">
            サービスについて
          </h1>
        </div>

        <div className="glass-card-strong rounded-lg p-6 border-t border-white/40">
          <h2 className="text-xl text-white mb-4 font-light">利用可能な機能</h2>
          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ 無制限に分析可能</li>
              <li>✓ 分析結果の保存</li>
              <li>✓ 分析履歴の閲覧</li>
              <li>✓ テキスト、画像、動画の分析に対応</li>
              <li>✓ 複数SNSプラットフォーム対応（Facebook、X、Instagram）</li>
            </ul>
          </div>
        </div>

        {/* サービス詳細 */}
        <div className="mt-8 glass-card-strong rounded-lg p-6">
          <h2 className="text-xl text-white mb-4 font-light">サービス詳細</h2>
          <div>
            <h3 className="text-white mb-3 font-light">SNS投稿分析サービス</h3>
            <ul className="space-y-2 text-sm text-gray-300 ml-4">
              <li>• SNS投稿の定性・定量分析（無制限）</li>
              <li>• 分析結果の保存機能</li>
              <li>• 分析履歴の閲覧機能</li>
              <li>• テキスト、画像、動画の分析に対応</li>
              <li>• 複数SNSプラットフォーム対応（Facebook、X、Instagram）</li>
              <li>• 意思決定支援機能（GO/HOLD/NO-GO判定）</li>
              <li>• ブランドセーフティ評価</li>
              <li>• PDFレポート生成機能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
