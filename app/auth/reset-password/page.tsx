"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/app/api/auth/reset-password/route";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("無効なリンクです");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("token", token);

    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // 成功時はredirectされるのでここには来ない
  }

  if (!token) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
        <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
          <h1 className="luxury-title text-2xl text-white mb-2 text-center">
            エラー
          </h1>
          <p className="text-gray-400 text-xs text-center mb-6 font-light">
            無効なリンクです
          </p>
          <Link
            href="/auth/forgot-password"
            className="block text-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all text-sm"
          >
            パスワードリセットを再申請
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
      <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
        <h1 className="luxury-title text-2xl text-white mb-2 text-center">
          新しいパスワードを設定
        </h1>
        <p className="text-gray-400 text-xs text-center mb-6 font-light">
          新しいパスワードを入力してください
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              新しいパスワード <span className="text-gray-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
              placeholder="6文字以上"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              パスワード（確認） <span className="text-gray-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
              placeholder="同じパスワードを入力"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? "設定中..." : "パスワードを設定"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          <Link
            href="/auth/signin"
            className="text-white hover:text-gray-300 underline"
          >
            ログインページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

