"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const registered = searchParams.get("registered");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
      <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
        <h1 className="luxury-title text-2xl text-white mb-2 text-center">
          ログイン
        </h1>
        <p className="text-gray-400 text-xs text-center mb-6 font-light">
          利用するためにはログインをしてください
        </p>

        {registered && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
            アカウントが作成されました。ログインしてください。
          </div>
        )}

        {searchParams.get("reset") && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
            パスワードがリセットされました。新しいパスワードでログインしてください。
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

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

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-400 mb-2 font-light uppercase tracking-wider"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
              placeholder="パスワードを入力"
              disabled={isLoading}
            />
            <p className="mt-2 text-right text-xs text-gray-400">
              <Link
                href="/auth/forgot-password"
                className="underline hover:text-gray-300"
              >
                パスワードを忘れた場合はこちら
              </Link>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/auth/signup"
            className="text-white hover:text-gray-300 underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-4">
        <div className="glass-card-strong rounded-lg p-8 w-full max-w-md">
          <h1 className="luxury-title text-2xl text-white mb-2 text-center">
            読み込み中...
          </h1>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

