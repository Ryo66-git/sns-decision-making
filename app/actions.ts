"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PostAnalysisInput {
  text: string;
  platform?: "Facebook" | "X" | "Instagram";
  platformType?: "フィード" | "リール" | "ストーリーズ"; // Instagram用
  imageBase64?: string;
  videoBase64?: string;
  imageMimeType?: string;
  videoMimeType?: string;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagementRate?: number;
  analysisType?: "pre" | "post"; // "pre": 投稿前の分析, "post": 投稿後の分析
}

export interface QualitativeAnalysis {
  summary: string;
  tone: "ポジティブ" | "ネガティブ" | "中立";
  targetAudience: string;
  messageClarity: string;
  emotionalAppeal: string;
  brandVoice: string;
}

export interface QuantitativeAnalysis {
  performanceSummary: string;
  engagementAnalysis: string;
  reachAnalysis: string;
  comparisonToAverage?: string;
}

export interface ImprovementSuggestions {
  contentImprovements: string[];
  timingSuggestions?: string;
  hashtagSuggestions?: string[];
  visualSuggestions?: string;
  nextPostRecommendations: string[];
}

// 意思決定判定
export interface DecisionResult {
  decision: "GO" | "HOLD" | "NO-GO";
  reason: string; // 社内説明にそのまま使える文章
}

// ブランドセーフティ評価
export type RiskLevel = "低" | "中" | "高";

export interface BrandSafetyEvaluation {
  brandToneMismatch: RiskLevel;
  misunderstandingRisk: RiskLevel;
  platformContextMismatch: RiskLevel;
  kpiTradeoff: RiskLevel;
  overallCaution: string; // この投稿を出す際の注意点
}

// 却下理由ジェネレーター
export interface RejectionReasons {
  forManagement?: string; // 上長・役員向け（論理重視）
  forBrand?: string; // 広報・ブランド担当向け（トーン重視）
  forCreator?: string; // 制作者向け（改善指示）
}

// 判断ログ
export interface DecisionLog {
  aiInsight: string; // AIの示唆
  finalDecision: "GO" | "HOLD" | "NO-GO";
  decisionReason: string; // 判断理由
  nextKpis: string[]; // 次に見るべきKPI
  reevaluationTiming: string; // 判断の再評価タイミング
}

// 次アクション指示
export interface NextAction {
  action: string; // 次に行うべきアクション
  successKpis: string[]; // 成功・失敗を判断するための具体KPI
  reviewTiming: string; // いつ・誰が確認すべきか
}

// 投稿案
export interface PostProposal {
  textProposals: string[]; // テキストの投稿案（複数案）
  creativeProposal: {
    type: "image" | "video";
    imagePrompt?: string; // 画像生成用のプロンプト
    videoStructure?: string; // 動画の構成イメージ（テキストベース）
    description: string; // クリエイティブの説明
  };
}

export interface AnalyzePostResult {
  qualitative: QualitativeAnalysis;
  quantitative: QuantitativeAnalysis;
  improvements: ImprovementSuggestions;
  decision: DecisionResult;
  brandSafety: BrandSafetyEvaluation;
  rejectionReasons?: RejectionReasons; // NO-GOまたはHOLDの場合のみ
  decisionLog: DecisionLog;
  nextAction: NextAction;
  postProposal?: PostProposal; // 投稿案（GOまたはHOLDの場合のみ）
}

export async function analyzePost(
  input: PostAnalysisInput
): Promise<AnalyzePostResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // デバッグ: APIキーの読み込み状況を確認（セキュリティのため、最初の4文字のみ表示）
  if (process.env.NODE_ENV === "development") {
    console.log("APIキーの読み込み状況:", apiKey ? `読み込まれました (${apiKey.substring(0, 4)}...)` : "読み込まれていません");
  }

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set.\n\n" +
      "対処方法:\n" +
      "1. プロジェクトルートに .env.local ファイルを作成してください\n" +
      "2. 以下の形式でAPIキーを設定してください:\n" +
      "   GEMINI_API_KEY=AIza...\n" +
      "3. 開発サーバーを再起動してください (npm run dev を停止して再起動)"
    );
  }

  if (apiKey.trim().length === 0) {
    throw new Error("GEMINI_API_KEY is empty. Please set a valid API key.");
  }

  // APIキーの形式を確認（Google APIキーは通常 "AIza" で始まる）
  if (!apiKey.startsWith("AIza")) {
    console.warn("警告: APIキーが期待される形式ではありません。Google APIキーは通常 'AIza' で始まります。");
    console.warn("現在のAPIキーの最初の文字:", apiKey.substring(0, 10) + "...");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 利用可能なモデル名を試す（最新のモデルから順に試行）
  // モデル名は "models/" プレフィックスなしで指定（SDKが自動的に処理）
  const modelNames = [
    "gemini-2.5-flash", // 最新の高速モデル
    "gemini-2.5-pro", // 最新の高精度モデル
    "gemini-1.5-flash", // 高速モデル
    "gemini-1.5-pro", // 高精度モデル
    "gemini-1.0-pro", // v1で利用可能なモデル
    "gemini-pro", // 基本モデル（後方互換性のため）
  ];

  // 分析用のデータを構築
  const analysisData: string[] = [];
  
  // SNSプラットフォーム情報
  if (input.platform) {
    let platformInfo = `【プラットフォーム】${input.platform}`;
    if (input.platform === "Instagram" && input.platformType) {
      platformInfo += ` (${input.platformType})`;
    }
    analysisData.push(platformInfo);
  }
  
  analysisData.push(`【投稿テキスト】\n${input.text}\n`);

  if (input.imageBase64) {
    analysisData.push(`【画像】画像が添付されています（${input.imageMimeType || "image"}）\n`);
  }

  if (input.videoBase64) {
    analysisData.push(`【動画】動画が添付されています（${input.videoMimeType || "video"}）\n`);
  }

  if (
    input.impressions !== undefined ||
    input.reach !== undefined ||
    input.likes !== undefined ||
    input.comments !== undefined ||
    input.shares !== undefined ||
    input.saves !== undefined ||
    input.engagementRate !== undefined
  ) {
    analysisData.push(`【定量データ】`);
    if (input.impressions !== undefined) {
      analysisData.push(`インプレッション数: ${input.impressions.toLocaleString()}`);
    }
    if (input.reach !== undefined) {
      analysisData.push(`リーチ数: ${input.reach.toLocaleString()}`);
    }
    if (input.likes !== undefined) {
      analysisData.push(`いいね数: ${input.likes.toLocaleString()}`);
    }
    if (input.comments !== undefined) {
      analysisData.push(`コメント数: ${input.comments.toLocaleString()}`);
    }
    if (input.shares !== undefined) {
      analysisData.push(`シェア数: ${input.shares.toLocaleString()}`);
    }
    if (input.saves !== undefined) {
      analysisData.push(`保存数: ${input.saves.toLocaleString()}`);
    }
    if (input.engagementRate !== undefined) {
      analysisData.push(`エンゲージメント率: ${input.engagementRate.toFixed(2)}%`);
    }
    analysisData.push("");
  }

  // 分析タイプに応じた説明を生成
  const analysisTypeContext = input.analysisType === "post"
    ? "これは「投稿後の分析」です。既に投稿された投稿の実績データ（インプレッション、リーチ、エンゲージメント等）を基に、このジャンル（テキストやクリエイティブ）の投稿を続けて良いかの意思決定を行ってください。"
    : "これは「投稿前の分析」です。まだ投稿されていない投稿内容を基に、この投稿をしていいかの意思決定を行ってください。";

  const decisionReasonDescription = input.analysisType === "post"
    ? "このジャンルの投稿を続けるべきかどうかを、社内説明にそのまま使える文章で明確に説明してください。GOの場合はこのジャンルの投稿の強みと継続すべき理由を、HOLDの場合は改善すべき点を、NO-GOの場合はこのジャンルの投稿をやめるべき理由を論理的に説明してください。"
    : "この投稿を出すべきかどうかを、社内説明にそのまま使える文章で明確に説明してください。GOの場合は投稿の強みを、HOLDの場合は修正すべき点を、NO-GOの場合は採用しない理由を論理的に説明してください。";

  const systemInstruction = `あなたは大手企業のSNS意思決定を支援するB2Bプロダクトのアナリストです。
このツールの目的は「投稿を改善すること」ではなく、「出す / 出さない / 修正する という意思決定を完結させること」です。
分析結果は、必ず"判断"と"説明可能な理由"に接続してください。

${analysisTypeContext}

以下のJSON形式で返してください：
{
  "qualitative": {
    "summary": "投稿の要約（100文字程度）",
    "tone": "ポジティブ" | "ネガティブ" | "中立",
    "targetAudience": "想定されるターゲットオーディエンスの詳細な説明",
    "messageClarity": "メッセージの明確さの評価",
    "emotionalAppeal": "感情的な訴求力の分析",
    "brandVoice": "ブランドボイスの一貫性の評価"
  },
  "quantitative": {
    "performanceSummary": "パフォーマンスの総合的な評価（数値データがある場合）",
    "engagementAnalysis": "エンゲージメントの分析（いいね、コメント、シェア、保存など）",
    "reachAnalysis": "リーチとインプレッションの分析",
    "comparisonToAverage": "業界平均や過去の投稿との比較（可能な場合）"
  },
  "improvements": {
    "contentImprovements": ["改善案1", "改善案2", "改善案3"],
    "timingSuggestions": "投稿タイミングの提案（可能な場合）",
    "hashtagSuggestions": ["ハッシュタグ提案1", "ハッシュタグ提案2"],
    "visualSuggestions": "画像・動画に関する提案（画像や動画がある場合）",
    "nextPostRecommendations": ["次回投稿の推奨事項1", "次回投稿の推奨事項2", "次回投稿の推奨事項3"]
  },
  "decision": {
    "decision": "GO" | "HOLD" | "NO-GO",
    "reason": "${decisionReasonDescription}"
  },
  "brandSafety": {
    "brandToneMismatch": "低" | "中" | "高",
    "misunderstandingRisk": "低" | "中" | "高",
    "platformContextMismatch": "低" | "中" | "高",
    "kpiTradeoff": "低" | "中" | "高",
    "overallCaution": "この投稿を出す際の注意点を、具体的で実用的な文章で記述してください。"
  },
  "rejectionReasons": {
    "forManagement": "上長・役員向けの却下理由（論理重視、データや戦略的観点から説明）",
    "forBrand": "広報・ブランド担当向けの却下理由（トーン重視、ブランドイメージやリスク管理の観点から説明）",
    "forCreator": "制作者向けの却下理由（改善指示、具体的な修正ポイントを明確に）"
  },
  "decisionLog": {
    "aiInsight": "AIの示唆を簡潔にまとめてください",
    "finalDecision": "GO" | "HOLD" | "NO-GO",
    "decisionReason": "判断理由を簡潔に記述してください",
    "nextKpis": ["次に見るべきKPI1", "次に見るべきKPI2"],
    "reevaluationTiming": "判断の再評価タイミング（例：投稿後24時間、1週間後など）"
  },
  "nextAction": {
    "action": "次に行うべきアクション（例：表現変更 / 媒体変更 / 投稿見送り / そのまま投稿）",
    "successKpis": ["成功・失敗を判断するための具体KPI1", "具体KPI2"],
    "reviewTiming": "いつ・誰が確認すべきか（例：投稿後24時間以内にマーケティング担当が確認）"
  },
  "postProposal": {
    "textProposals": ["投稿テキスト案1", "投稿テキスト案2", "投稿テキスト案3"],
    "creativeProposal": {
      "type": "image" | "video",
      "imagePrompt": "画像生成用のプロンプト（画像の場合のみ、具体的で詳細な画像生成AI用のプロンプトを英語で記述）",
      "videoStructure": "動画の構成イメージ（動画の場合のみ、シーンごとの構成、カット割り、テキストオーバーレイなどを詳細に記述）",
      "description": "クリエイティブの説明（画像または動画のコンセプト、視覚的な要素、色使い、雰囲気などを日本語で記述）"
    }
  }
}

重要：
- rejectionReasonsは、decisionが"HOLD"または"NO-GO"の場合のみ生成してください。GOの場合はnullまたは空オブジェクトにしてください。
- postProposalは、decisionが"GO"または"HOLD"の場合のみ生成してください。NO-GOの場合はnullまたは空オブジェクトにしてください。
- 投稿案は、分析結果を踏まえて、改善された具体的な投稿内容を提案してください。
- テキスト案は3つ程度、それぞれ異なるアプローチ（トーン、長さ、訴求ポイントなど）で提案してください。
- クリエイティブのtypeは、元の投稿に画像がある場合は"image"、動画がある場合は"video"、どちらもない場合は"image"としてください。
- すべての出力は、人間がそのまま判断に使える自然言語で記述してください。
- 箇条書きと短い段落を併用してください。
- 「分析結果」ではなく「意思決定結果」を主語にしてください。`;

  const prompt = `${systemInstruction}\n\n以下の投稿データを分析してください:\n\n${analysisData.join("\n")}`;

  let lastError: Error | null = null;
  const errors: string[] = [];

  // 利用可能なモデルを見つけるまで試行
  for (const modelName of modelNames) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`モデル ${modelName} を試行中...`);
      }
      
      // systemInstructionをサポートしているモデルの場合
      let model;
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });
        if (process.env.NODE_ENV === "development") {
          console.log(`✓ モデル ${modelName} の初期化に成功しました`);
        }
      } catch (initError) {
        // systemInstructionがサポートされていない場合は、プロンプトに含める
        if (process.env.NODE_ENV === "development") {
          console.log(`systemInstructionがサポートされていないため、プロンプトに含めます: ${modelName}`);
        }
        model = genAI.getGenerativeModel({
          model: modelName,
        });
      }

      // マルチモーダルコンテンツを構築（テキスト + 画像/動画）
      const parts: (string | { inlineData: { data: string; mimeType: string } })[] = [
        prompt
      ];

      if (input.imageBase64) {
        parts.push({
          inlineData: {
            data: input.imageBase64,
            mimeType: input.imageMimeType || "image/jpeg",
          },
        });
      }

      if (input.videoBase64) {
        parts.push({
          inlineData: {
            data: input.videoBase64,
            mimeType: input.videoMimeType || "video/mp4",
          },
        });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      
      if (process.env.NODE_ENV === "development") {
        console.log(`✓ モデル ${modelName} で分析が成功しました`);
      }

      // JSONを抽出（マークダウンコードブロックがある場合に対応）
      let jsonText = text.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // JSONをパース
      let parsedResult: AnalyzePostResult;
      try {
        parsedResult = JSON.parse(jsonText);
      } catch (parseError) {
        // JSONパースエラーの場合、エラーメッセージを返す
        throw new Error(`JSONのパースに失敗しました: ${parseError instanceof Error ? parseError.message : "Unknown error"}\n\nレスポンス:\n${text.substring(0, 500)}`);
      }

      // 結果の検証
      if (
        !parsedResult.qualitative ||
        !parsedResult.quantitative ||
        !parsedResult.improvements ||
        !parsedResult.decision ||
        !parsedResult.brandSafety ||
        !parsedResult.decisionLog ||
        !parsedResult.nextAction
      ) {
        throw new Error("レスポンスの構造が正しくありません");
      }

      // rejectionReasonsはHOLDまたはNO-GOの場合のみ必要
      if (
        (parsedResult.decision.decision === "HOLD" ||
          parsedResult.decision.decision === "NO-GO") &&
        !parsedResult.rejectionReasons
      ) {
        // rejectionReasonsが生成されていない場合は空オブジェクトを設定
        parsedResult.rejectionReasons = {};
      }

      // postProposalはGOまたはHOLDの場合のみ必要
      if (
        (parsedResult.decision.decision === "GO" ||
          parsedResult.decision.decision === "HOLD")
      ) {
        if (!parsedResult.postProposal) {
          // postProposalが生成されていない場合は生成
          const creativeType = input.videoBase64 ? "video" : "image";
          parsedResult.postProposal = {
            textProposals: [],
            creativeProposal: {
              type: creativeType,
              description: "",
            },
          };
        } else {
          // クリエイティブのtypeを元の投稿内容に基づいて設定
          if (!parsedResult.postProposal.creativeProposal.type) {
            parsedResult.postProposal.creativeProposal.type = input.videoBase64 ? "video" : "image";
          }
        }
      } else {
        // NO-GOの場合はpostProposalを削除
        parsedResult.postProposal = undefined;
      }

      return parsedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorDetails = error instanceof Error ? error.stack : String(error);
      errors.push(`${modelName}: ${errorMessage}`);
      lastError = error instanceof Error ? error : new Error(String(error));

      // 404エラーの場合は次のモデルを試す
      if (errorMessage.includes("404")) {
        if (process.env.NODE_ENV === "development") {
          console.error(`モデル ${modelName} が見つかりません (404)`);
          console.error(`APIキーの状態: ${apiKey ? `設定済み (${apiKey.substring(0, 4)}...)` : "未設定"}`);
        }
        continue;
      }

      // 429（レート制限）やquotaエラーの場合は次のモデルを試す
      if (errorMessage.includes("429") || errorMessage.includes("quota")) {
        console.error(`モデル ${modelName} でレート制限エラー:`, errorDetails);
        continue;
      }

      // 認証エラー（401, 403）の場合はAPIキーの問題の可能性がある
      if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")) {
        throw new Error(`APIキーの認証に失敗しました。GEMINI_API_KEYが正しく設定されているか確認してください。エラー: ${errorMessage}`);
      }

      // その他のエラーも次のモデルを試す
      console.error(`モデル ${modelName} でエラーが発生しました:`, errorDetails);
      continue;
    }
  }

  // すべてのモデルで失敗した場合
  const errorSummary = errors.length > 0 ? `\n\nエラー詳細:\n${errors.join("\n")}` : "";
  
  // すべてのモデルが404を返している場合、APIキーの問題の可能性が高い
  const all404 = errors.every(e => e.includes("404"));
  const apiKeyIssue = all404 
    ? "\n\n【重要】すべてのモデルが404エラーを返しています。これは通常、以下のいずれかが原因です：\n" +
      "1. APIキーが無効または期限切れ\n" +
      "2. APIキーにGemini APIへのアクセス権限がない\n" +
      "3. APIキーが正しく設定されていない（環境変数が読み込まれていない）\n" +
      "4. APIキーが制限されている（IP制限、リファラー制限など）\n\n" +
      "【確認手順】\n" +
      "1. .env.local または .env ファイルに GEMINI_API_KEY=AIza... が正しく設定されているか確認\n" +
      "2. 開発サーバーを再起動して環境変数を読み込む（npm run dev を停止して再起動）\n" +
      "3. Google AI Studio (https://aistudio.google.com/) で新しいAPIキーを生成\n" +
      "4. APIキーに「Generative Language API」へのアクセス権限があるか確認\n" +
      "5. Google Cloud Consoleで「Generative Language API」が有効になっているか確認"
    : "";
  
  throw new Error(
    `利用可能なモデルが見つかりませんでした。試行したモデル: ${modelNames.join(", ")}。最後のエラー: ${lastError?.message || "Unknown error"}${errorSummary}${apiKeyIssue}`
  );
}

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
  const { prisma } = await import("@/lib/prisma");
  const { auth } = await import("@/lib/auth");
  
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
