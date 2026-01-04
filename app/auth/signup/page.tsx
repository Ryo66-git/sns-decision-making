"use client";

import { useState } from "react";
import { registerUser } from "@/app/actions";
import Link from "next/link";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
      <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
        <h1 className="luxury-title text-2xl text-white mb-2 text-center">
          アカウント作成
        </h1>
        <p className="text-gray-400 text-xs text-center mb-6 font-light">
          利用するためにはログインをしてください
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              名前（オプション）
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
              placeholder="山田太郎"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              メールアドレス <span className="text-gray-500">*</span>
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

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              パスワード <span className="text-gray-500">*</span>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? "作成中..." : "アカウントを作成"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          既にアカウントをお持ちですか？{" "}
          <Link
            href="/auth/signin"
            className="text-white hover:text-gray-300 underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

