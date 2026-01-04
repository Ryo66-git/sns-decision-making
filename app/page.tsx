"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  analyzePost,
  AnalyzePostResult,
  PostAnalysisInput,
} from "./actions";
import { saveAnalysis } from "./actions";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [analysisType, setAnalysisType] = useState<"pre" | "post">("pre");
  const [postText, setPostText] = useState("");
  const [platform, setPlatform] = useState<"Facebook" | "X" | "Instagram" | "">("");
  const [platformType, setPlatformType] = useState<"フィード" | "リール" | "ストーリーズ" | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [impressions, setImpressions] = useState("");
  const [reach, setReach] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzePostResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);


  // 未ログインの場合はログインページにリダイレクト（useEffectで処理）
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [mounted, status, router]);


  // サーバー側とクライアント側で同じ初期状態を保つため、mountedがfalseの間は何も表示しない
  if (!mounted) {
    return null;
  }

  // セッションが読み込み中の場合はローディング画面を表示
  if (status === "loading") {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="text-white text-sm">読み込み中...</div>
      </div>
    );
  }

  // 未ログインの場合は何も表示しない（リダイレクト中）
  if (!session) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <div className="text-white text-sm">読み込み中...</div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        // ファイルサイズチェック（20MB制限）
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
          setError(`画像ファイルのサイズが大きすぎます。20MB以下のファイルを選択してください。（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`);
          return;
        }
        setImageFile(file);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("画像ファイルを選択してください");
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        // ファイルサイズチェック（100MB制限）
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
          setError(`動画ファイルのサイズが大きすぎます。100MB以下のファイルを選択してください。（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`);
          return;
        }
        setVideoFile(file);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("動画ファイルを選択してください");
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!postText.trim()) {
      setError("投稿テキストを入力してください");
      return;
    }

    if (!platform) {
      setError("SNSプラットフォームを選択してください");
      return;
    }

    if (platform === "Instagram" && !platformType) {
      setError("Instagramタイプ（フィード、リール、ストーリーズ）を選択してください");
      return;
    }


    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      let videoBase64: string | undefined;
      let videoMimeType: string | undefined;

      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
        imageMimeType = imageFile.type;
      }

      if (videoFile) {
        videoBase64 = await fileToBase64(videoFile);
        videoMimeType = videoFile.type;
      }

      const input: PostAnalysisInput = {
        text: postText.trim(),
        platform: platform || undefined,
        platformType: platform === "Instagram" && platformType ? platformType : undefined,
        imageBase64,
        imageMimeType,
        videoBase64,
        videoMimeType,
        impressions: impressions ? parseInt(impressions) : undefined,
        reach: reach ? parseInt(reach) : undefined,
        likes: likes ? parseInt(likes) : undefined,
        comments: comments ? parseInt(comments) : undefined,
        shares: shares ? parseInt(shares) : undefined,
        saves: saves ? parseInt(saves) : undefined,
        engagementRate: engagementRate
          ? parseFloat(engagementRate)
          : undefined,
        analysisType: analysisType,
      };

      const analysisResult = await analyzePost(input);
      setResult(analysisResult);

      // ログインしている場合は結果を保存
      if (session?.user) {
        const saveResult = await saveAnalysis(
          {
            text: input.text,
            platform: input.platform,
            platformType: input.platformType,
            imageBase64: input.imageBase64,
            imageMimeType: input.imageMimeType,
            videoBase64: input.videoBase64,
            videoMimeType: input.videoMimeType,
            impressions: input.impressions,
            reach: input.reach,
            likes: input.likes,
            comments: input.comments,
            shares: input.shares,
            saves: input.saves,
            engagementRate: input.engagementRate,
          } as any,
          analysisResult
        );
        if (saveResult?.error) {
          setSaveStatus(`保存に失敗: ${saveResult.error}`);
        } else {
          setSaveStatus("分析結果を保存しました");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "分析中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getToneColor = (tone: string) => {
    if (tone.includes("ポジティブ")) {
      return "bg-white/10 text-gray-200 border-white/20 backdrop-blur-sm";
    } else if (tone.includes("ネガティブ")) {
      return "bg-white/10 text-gray-200 border-white/20 backdrop-blur-sm";
    } else {
      return "bg-white/10 text-gray-300 border-white/20 backdrop-blur-sm";
    }
  };

  return (
    <div className="min-h-screen dashboard-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-4 gap-3">
            {session && (
              <>
                <Link
                  href="/history"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all"
                >
                  履歴
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all"
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
          <div className="inline-block mb-4">
            <h1 className="luxury-title text-white">
              SNS投稿 意思決定ツール
            </h1>
          </div>
          <p className="text-gray-400 text-xs font-light leading-relaxed max-w-xl mx-auto tracking-[0.1em]">
            AIがあなたのSNS投稿を定性・定量分析し、<br />
            次回投稿の改善案を提供、投稿に必要な意思決定をサポートします
          </p>
        </div>

        {/* 入力エリア */}
        <div className="glass-card-strong rounded-lg p-8 mb-8 hover-lift border-t border-white/10">
          {/* 分析タイプ選択 */}
          <div className="mb-6">
            <label
              htmlFor="analysis-type"
              className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
            >
              分析タイプ <span className="text-gray-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setAnalysisType("pre")}
                disabled={isLoading}
                className={`px-4 py-3 rounded-lg border transition-all text-sm font-light ${
                  analysisType === "pre"
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                投稿前の分析
              </button>
              <button
                type="button"
                onClick={() => setAnalysisType("post")}
                disabled={isLoading}
                className={`px-4 py-3 rounded-lg border transition-all text-sm font-light ${
                  analysisType === "post"
                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                    : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                投稿後の分析
              </button>
            </div>
            <p className="text-gray-500 text-xs font-light mt-2">
              {analysisType === "pre"
                ? "この投稿をしていいかの意思決定を行います"
                : "このジャンル（テキストやクリエイティブ）の投稿を続けて良いかの意思決定を行います"}
            </p>
          </div>

          {/* SNS選択 */}
          <div className="mb-6">
            <label
              htmlFor="platform"
              className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
            >
              SNSプラットフォーム <span className="text-gray-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {(["Facebook", "X", "Instagram"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPlatform(p);
                    if (p !== "Instagram") {
                      setPlatformType("");
                    }
                  }}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-lg border transition-all text-sm font-light ${
                    platform === p
                      ? "bg-white/20 border-white/40 text-white"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {p}
                </button>
              ))}
            </div>
            {platform === "Instagram" && (
              <div className="mt-4">
                <label
                  htmlFor="platform-type"
                  className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
                >
                  Instagramタイプ
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["フィード", "リール", "ストーリーズ"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPlatformType(type)}
                      disabled={isLoading}
                      className={`px-4 py-3 rounded-lg border transition-all text-sm font-light ${
                        platformType === type
                          ? "bg-white/20 border-white/40 text-white"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* テキスト入力 */}
          <div className="mb-6">
            <label
              htmlFor="post-text"
              className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
            >
              投稿テキスト <span className="text-gray-500">*</span>
            </label>
            <textarea
              id="post-text"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="投稿予定もしくは実際に投稿したテキストを貼り付けてください"
              className="w-full h-48 px-5 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 resize-none text-white placeholder:text-gray-500 transition-all font-light text-sm"
              disabled={isLoading}
            />
          </div>

          {/* メディアアップロード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                htmlFor="image-upload"
                className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
              >
                画像（オプション）
              </label>
              <input
                ref={imageInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading}
              />
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-sm font-light"
                >
                  {imageFile ? "画像を変更" : "画像を選択"}
                </button>
                {imagePreview && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img
                      src={imagePreview}
                      alt="プレビュー"
                      className="relative w-full h-48 object-contain rounded-lg border border-white/20 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={isLoading}
                      className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 disabled:opacity-30 transition-all border border-white/20"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-400 mt-2 font-light">
                      {imageFile?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="video-upload"
                className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider"
              >
                動画（オプション）
              </label>
              <input
                ref={videoInputRef}
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                disabled={isLoading}
              />
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm text-sm font-light"
                >
                  {videoFile ? "動画を変更" : "動画を選択"}
                </button>
                {videoPreview && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <video
                      src={videoPreview}
                      controls
                      className="relative w-full h-48 rounded-lg border border-white/20 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      disabled={isLoading}
                      className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60 disabled:opacity-30 transition-all border border-white/20"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-400 mt-2 font-light">
                      {videoFile?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 定量データ（投稿後の分析の場合のみ表示） */}
          {analysisType === "post" && (
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-4 uppercase tracking-wider">
              定量データ（実績数値） <span className="text-gray-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* リーチ・インプレッション */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-5">
                <label className="block text-xs text-gray-400 mb-4 font-light uppercase tracking-wider">
                  リーチ・インプレッション
                </label>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="impressions"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      インプレッション数
                    </label>
                    <input
                      id="impressions"
                      type="number"
                      value={impressions}
                      onChange={(e) => setImpressions(e.target.value)}
                      placeholder="1000"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reach"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      リーチ数
                    </label>
                    <input
                      id="reach"
                      type="number"
                      value={reach}
                      onChange={(e) => setReach(e.target.value)}
                      placeholder="800"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* エンゲージメント */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-5">
                <label className="block text-xs text-gray-400 mb-4 font-light uppercase tracking-wider">
                  エンゲージメント
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="likes"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      いいね数
                    </label>
                    <input
                      id="likes"
                      type="number"
                      value={likes}
                      onChange={(e) => setLikes(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="comments"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      コメント数
                    </label>
                    <input
                      id="comments"
                      type="number"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shares"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      シェア数
                    </label>
                    <input
                      id="shares"
                      type="number"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="saves"
                      className="block text-xs text-gray-500 mb-2 font-light"
                    >
                      保存数
                    </label>
                    <input
                      id="saves"
                      type="number"
                      value={saves}
                      onChange={(e) => setSaves(e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="engagement-rate"
                    className="block text-xs text-gray-500 mb-2 font-light"
                  >
                    エンゲージメント率（%）
                  </label>
                  <input
                    id="engagement-rate"
                    type="number"
                    step="0.01"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    placeholder="5.5"
                    className="w-full px-3 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg focus:ring-1 focus:ring-white/30 focus:border-white/30 text-white placeholder:text-gray-500 transition-all font-light text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !postText.trim()}
              className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm tracking-wider uppercase"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  分析中...
                </>
              ) : (
                "分析する"
              )}
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="glass-card bg-white/10 border-white/20 text-gray-300 px-6 py-4 rounded-lg mb-6 backdrop-blur-md border-l-2 border-l-white/40">
            <p className="font-medium text-white text-sm uppercase tracking-wider mb-2">エラー</p>
            <p className="text-sm mt-2 font-light text-gray-400">{error}</p>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="space-y-6">
            {/* 分析結果セクション */}
            <div className="mb-8">
              <h2 className="luxury-title text-2xl text-white mb-6 inline-block">
                分析結果
              </h2>
            </div>

            {/* 定性分析セクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                定性分析
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">要約</h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.qualitative.summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">感情</h4>
                  <span
                    className={`inline-block px-5 py-2.5 rounded-full text-sm font-semibold border ${getToneColor(
                      result.qualitative.tone
                    )}`}
                  >
                    {result.qualitative.tone}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    想定ターゲット
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.qualitative.targetAudience}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    メッセージの明確さ
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.qualitative.messageClarity}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    感情的な訴求力
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.qualitative.emotionalAppeal}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    ブランドボイス
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.qualitative.brandVoice}
                  </p>
                </div>
              </div>
            </div>

            {/* 定量分析セクション */}
            {result.quantitative && (
              <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
                <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  定量分析
                </h3>

                <div className="space-y-5">
                  {result.quantitative.performanceSummary && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        パフォーマンス総評
                      </h4>
                      <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.quantitative.performanceSummary}
                      </p>
                    </div>
                  )}

                  {result.quantitative.engagementAnalysis && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        エンゲージメント分析
                      </h4>
                      <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.quantitative.engagementAnalysis}
                      </p>
                    </div>
                  )}

                  {result.quantitative.reachAnalysis && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        リーチ分析
                      </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.quantitative.reachAnalysis}
                      </p>
                    </div>
                  )}

                  {result.quantitative.comparisonToAverage && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        比較分析
                      </h4>
                      <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.quantitative.comparisonToAverage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 改善案セクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                改善案
              </h3>

              <div className="space-y-5">
                {result.improvements.contentImprovements &&
                  result.improvements.contentImprovements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        コンテンツ改善案
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-200 bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.improvements.contentImprovements.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {result.improvements.timingSuggestions && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                      投稿タイミングの提案
                    </h4>
                    <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                      {result.improvements.timingSuggestions}
                    </p>
                  </div>
                )}

                {result.improvements.hashtagSuggestions &&
                  result.improvements.hashtagSuggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        ハッシュタグ提案
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.improvements.hashtagSuggestions.map(
                          (tag, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-white/10 backdrop-blur-md text-gray-200 rounded-full text-sm font-light border border-white/20 hover:bg-white/15 transition-all"
                            >
                              #{tag}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {result.improvements.visualSuggestions && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                      ビジュアル提案
                    </h4>
                    <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                      {result.improvements.visualSuggestions}
                    </p>
                  </div>
                )}

                {result.improvements.nextPostRecommendations &&
                  result.improvements.nextPostRecommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        次回投稿の推奨事項
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-200 bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.improvements.nextPostRecommendations.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* テキストの投稿案（GOまたはHOLDの場合のみ） */}
                {result.postProposal &&
                  result.postProposal.textProposals &&
                  result.postProposal.textProposals.length > 0 &&
                  (result.decision.decision === "GO" ||
                    result.decision.decision === "HOLD") && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-3 text-sm uppercase tracking-wider">
                        テキストの改善案
                      </h4>
                      <div className="space-y-3">
                        {result.postProposal.textProposals.map(
                          (proposal, index) => (
                            <div
                              key={index}
                              className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10"
                            >
                              <div className="flex items-start gap-3">
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs font-light flex-shrink-0">
                                  案{index + 1}
                                </span>
                                <p className="text-gray-200 leading-relaxed font-light text-sm flex-1 whitespace-pre-wrap">
                                  {proposal}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* クリエイティブの改善案（GOまたはHOLDの場合のみ） */}
                {result.postProposal &&
                  result.postProposal.creativeProposal &&
                  (result.decision.decision === "GO" ||
                    result.decision.decision === "HOLD") && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-3 text-sm uppercase tracking-wider">
                        クリエイティブの改善案
                      </h4>
                      <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10 space-y-4">
                        <div>
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 text-xs font-light">
                            {result.postProposal.creativeProposal.type ===
                            "image"
                              ? "画像"
                              : "動画"}
                          </span>
                        </div>

                        {result.postProposal.creativeProposal.description && (
                          <div>
                            <h5 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">
                              コンセプト・説明
                            </h5>
                            <p className="text-gray-200 leading-relaxed font-light text-sm">
                              {
                                result.postProposal.creativeProposal
                                  .description
                              }
                            </p>
                          </div>
                        )}

                        {result.postProposal.creativeProposal.type ===
                          "image" &&
                          result.postProposal.creativeProposal
                            .imagePrompt && (
                            <div>
                              <h5 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">
                                画像生成プロンプト
                              </h5>
                              <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                <p className="text-gray-300 leading-relaxed font-light text-sm font-mono">
                                  {
                                    result.postProposal.creativeProposal
                                      .imagePrompt
                                  }
                                </p>
                              </div>
                              <p className="text-gray-500 text-xs mt-2 font-light">
                                ※ このプロンプトを画像生成AI（DALL-E、Midjourney、Stable Diffusion等）に入力して画像を生成してください
                              </p>
                            </div>
                          )}

                        {result.postProposal.creativeProposal.type ===
                          "video" &&
                          result.postProposal.creativeProposal
                            .videoStructure && (
                            <div>
                              <h5 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">
                                動画構成イメージ
                              </h5>
                              <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                <p className="text-gray-300 leading-relaxed font-light text-sm whitespace-pre-wrap">
                                  {
                                    result.postProposal.creativeProposal
                                      .videoStructure
                                  }
                                </p>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* 意思決定結果セクション */}
            <div className="mb-8 mt-12">
              <h2 className="luxury-title text-2xl text-white mb-6 inline-block">
                意思決定結果
              </h2>
            </div>

            {/* 意思決定判定セクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                意思決定判定
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 text-sm uppercase tracking-wider">
                    判定結果
                  </h4>
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`px-6 py-3 rounded-lg text-lg font-semibold border-2 ${
                        result.decision.decision === "GO"
                          ? "bg-green-500/20 border-green-500/50 text-green-300"
                          : result.decision.decision === "HOLD"
                          ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                          : "bg-red-500/20 border-red-500/50 text-red-300"
                      }`}
                    >
                      {result.decision.decision === "GO"
                        ? "GO（出してよい）"
                        : result.decision.decision === "HOLD"
                        ? "HOLD（修正すれば可）"
                        : "NO-GO（今回は出さない）"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    判定理由
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.decision.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* ブランドセーフティ評価セクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                ブランドセーフティ評価
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-gray-300 mb-2 text-sm uppercase tracking-wider">
                      ブランドトーンとの不整合リスク
                    </h4>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        result.brandSafety.brandToneMismatch === "低"
                          ? "bg-green-500/20 text-green-300"
                          : result.brandSafety.brandToneMismatch === "中"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result.brandSafety.brandToneMismatch}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-gray-300 mb-2 text-sm uppercase tracking-wider">
                      誤解・炎上リスク
                    </h4>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        result.brandSafety.misunderstandingRisk === "低"
                          ? "bg-green-500/20 text-green-300"
                          : result.brandSafety.misunderstandingRisk === "中"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result.brandSafety.misunderstandingRisk}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-gray-300 mb-2 text-sm uppercase tracking-wider">
                      媒体文脈とのズレ
                    </h4>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        result.brandSafety.platformContextMismatch === "低"
                          ? "bg-green-500/20 text-green-300"
                          : result.brandSafety.platformContextMismatch === "中"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result.brandSafety.platformContextMismatch}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-medium text-gray-300 mb-2 text-sm uppercase tracking-wider">
                      KPIとブランドのトレードオフ
                    </h4>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        result.brandSafety.kpiTradeoff === "低"
                          ? "bg-green-500/20 text-green-300"
                          : result.brandSafety.kpiTradeoff === "中"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {result.brandSafety.kpiTradeoff}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    この投稿を出す際の注意点
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.brandSafety.overallCaution}
                  </p>
                </div>
              </div>
            </div>

            {/* 却下理由セクション（HOLDまたはNO-GOの場合のみ） */}
            {result.rejectionReasons &&
              (result.decision.decision === "HOLD" ||
                result.decision.decision === "NO-GO") && (
                <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
                  <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    却下理由（用途別）
                  </h3>

                  <div className="space-y-5">
                    {result.rejectionReasons.forManagement && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                          上長・役員向け（論理重視）
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                          {result.rejectionReasons.forManagement}
                        </p>
                      </div>
                    )}

                    {result.rejectionReasons.forBrand && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                          広報・ブランド担当向け（トーン重視）
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                          {result.rejectionReasons.forBrand}
                        </p>
                      </div>
                    )}

                    {result.rejectionReasons.forCreator && (
                      <div>
                        <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                          制作者向け（改善指示）
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                          {result.rejectionReasons.forCreator}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* 判断ログセクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                判断ログ
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    AIの示唆
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.decisionLog.aiInsight}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    最終判断
                  </h4>
                  <span
                    className={`inline-block px-5 py-2.5 rounded-full text-sm font-semibold border ${
                      result.decisionLog.finalDecision === "GO"
                        ? "bg-green-500/20 border-green-500/50 text-green-300"
                        : result.decisionLog.finalDecision === "HOLD"
                        ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                        : "bg-red-500/20 border-red-500/50 text-red-300"
                    }`}
                  >
                    {result.decisionLog.finalDecision === "GO"
                      ? "GO"
                      : result.decisionLog.finalDecision === "HOLD"
                      ? "HOLD"
                      : "NO-GO"}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    判断理由
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.decisionLog.decisionReason}
                  </p>
                </div>

                {result.decisionLog.nextKpis &&
                  result.decisionLog.nextKpis.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        次に見るべきKPI
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-200 bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.decisionLog.nextKpis.map((kpi, index) => (
                          <li key={index}>{kpi}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    判断の再評価タイミング
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.decisionLog.reevaluationTiming}
                  </p>
                </div>
              </div>
            </div>

            {/* 次アクション指示セクション */}
            <div className="glass-card-strong rounded-lg p-8 hover-lift border-t border-white/10">
              <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3 border-b border-white/10 pb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                次アクション指示
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    次に行うべきアクション
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.nextAction.action}
                  </p>
                </div>

                {result.nextAction.successKpis &&
                  result.nextAction.successKpis.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                        成功・失敗を判断するための具体KPI
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-gray-200 bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                        {result.nextAction.successKpis.map((kpi, index) => (
                          <li key={index}>{kpi}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div>
                  <h4 className="font-medium text-gray-300 mb-2.5 text-sm uppercase tracking-wider">
                    確認タイミング・担当者
                  </h4>
                  <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-4 backdrop-blur-sm font-light text-sm">
                    {result.nextAction.reviewTiming}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
        </div>
    </div>
  );
}
