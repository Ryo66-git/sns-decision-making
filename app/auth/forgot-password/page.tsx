"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/api/auth/forgot-password/route";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
      <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
        <h1 className="luxury-title text-2xl text-white mb-2 text-center">
          パスワードを忘れた場合
        </h1>
        <p className="text-gray-400 text-xs text-center mb-6 font-light">
          登録済みのメールアドレスを入力してください
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
              パスワードリセット用のメールを送信しました。
              <br />
              メールに記載されたリンクからパスワードをリセットしてください。
            </div>
            <Link
              href="/auth/signin"
              className="block text-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all text-sm"
            >
              ログインページに戻る
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                placeholder="example@email.com"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? "送信中..." : "リセットメールを送信"}
            </button>
          </form>
        )}

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

