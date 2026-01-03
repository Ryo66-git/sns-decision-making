"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnalyzePostResult } from "@/app/actions";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface AnalysisHistory {
  id: string;
  platform: string | null;
  platformType: string | null;
  postText: string;
  imageBase64: string | null;
  imageMimeType: string | null;
  videoBase64: string | null;
  videoMimeType: string | null;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  engagementRate: number | null;
  result: AnalyzePostResult;
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistory | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchAnalyses();
    }
  }, [status, router]);

  async function fetchAnalyses() {
    try {
      const response = await fetch("/api/analysis/history");
      if (!response.ok) {
        throw new Error("履歴の取得に失敗しました");
      }
      const data = await response.json();
      setAnalyses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const getToneColor = (tone: string) => {
    if (tone.includes("ポジティブ")) {
      return "bg-green-500/20 text-green-200 border-green-500/50";
    } else if (tone.includes("ネガティブ")) {
      return "bg-red-500/20 text-red-200 border-red-500/50";
    }
    return "bg-gray-500/20 text-gray-200 border-gray-500/50";
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === analyses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(analyses.map((a) => a.id)));
    }
  };

  // 投稿前か投稿後かを判定する関数
  const isPostAnalysis = (analysis: AnalysisHistory): boolean => {
    return !!(
      analysis.impressions ||
      analysis.reach ||
      analysis.likes ||
      analysis.comments ||
      analysis.shares ||
      analysis.saves ||
      analysis.engagementRate !== null
    );
  };

  // 投稿前と投稿後に分ける
  const prePostAnalyses = analyses.filter((a) => !isPostAnalysis(a));
  const postPostAnalyses = analyses.filter((a) => isPostAnalysis(a));

  const generatePDF = async () => {
    if (selectedIds.size === 0) {
      alert("PDF化する投稿を選択してください");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const selectedAnalyses = analyses.filter((a) => selectedIds.has(a.id));
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < selectedAnalyses.length; i++) {
        const analysis = selectedAnalyses[i];
        
        // 新しいページを作成（最初のページ以外）
        if (i > 0) {
          pdf.addPage();
        }

        // PDFレポートのHTMLを作成
        const reportHTML = createReportHTML(analysis);
        
        // 一時的なDOM要素を作成（PDF用に最適化）
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.width = "281mm"; // A4 landscape width (297mm - 16mm padding)
        tempDiv.style.minHeight = "190mm"; // A4 landscape height (210mm - 20mm margin)
        tempDiv.style.backgroundColor = "#0a0a0a";
        tempDiv.style.color = "#ffffff";
        tempDiv.style.boxSizing = "border-box";
        tempDiv.innerHTML = reportHTML;
        document.body.appendChild(tempDiv);

        // HTMLをキャンバスに変換
        const canvas = await html2canvas(tempDiv, {
          background: "#0a0a0a",
          useCORS: true,
          logging: false,
        });

        // キャンバスを画像に変換
        const imgData = canvas.toDataURL("image/png");
        
        // A4横向きサイズに合わせて画像を配置
        const imgWidth = 297; // A4 landscape width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // ページに収まるように調整
        const pageHeight = 210; // A4 landscape height in mm
        if (imgHeight > pageHeight) {
          const scale = pageHeight / imgHeight;
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth * scale, pageHeight, undefined, "FAST");
        } else {
          pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
        }

        // 一時要素を削除
        document.body.removeChild(tempDiv);
      }

      // PDFをダウンロード
      const fileName = `sns-analysis-report-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF生成エラー:", err);
      alert("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const createReportHTML = (analysis: AnalysisHistory): string => {
    const formatDateForPDF = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
      } catch {
        return "";
      }
    };

    const escapeHtml = (text: string): string => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    // PDF用に最適化されたレイアウト
    return `
      <div style="font-family: 'Helvetica', 'Arial', 'Hiragino Sans', 'Meiryo', sans-serif; color: #ffffff; background: #0a0a0a; width: 100%; min-height: 190mm; padding: 8mm; box-sizing: border-box;">
        <!-- タイトル -->
        <div style="margin-bottom: 8mm; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4mm;">
          <h1 style="font-size: 18px; font-weight: 300; margin: 0; letter-spacing: 1px; color: #ffffff;">
            SNS投稿分析レポート
          </h1>
        </div>
        
        <!-- 2カラムレイアウト -->
        <div style="display: table; width: 100%; table-layout: fixed;">
          <div style="display: table-row;">
            <!-- 左カラム -->
            <div style="display: table-cell; width: 48%; vertical-align: top; padding-right: 4mm;">
              <!-- 投稿内容 -->
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff;">投稿内容</h2>
                <div style="margin-bottom: 2mm; font-size: 10px;">
                  ${analysis.platform ? `<span style="display: inline-block; padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-right: 4px;">${analysis.platform}${analysis.platformType ? ` (${analysis.platformType})` : ""}</span>` : ""}
                  <span style="color: #999;">${formatDateForPDF(analysis.createdAt)}</span>
                </div>
                <p style="color: #ffffff; font-size: 10px; line-height: 1.6; white-space: pre-wrap; margin: 0 0 3mm 0; word-wrap: break-word;">
                  ${escapeHtml(analysis.postText)}
                </p>
                ${analysis.imageBase64 ? `<img src="data:${analysis.imageMimeType || "image/jpeg"};base64,${analysis.imageBase64}" style="max-width: 100%; max-height: 50mm; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); object-fit: contain; display: block; margin-top: 2mm;" />` : ""}
                ${analysis.videoBase64 && !analysis.imageBase64 ? `<div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.05); border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); margin-top: 2mm;"><p style="color: #999; font-size: 10px; margin: 0;">動画コンテンツ</p></div>` : ""}
              </div>

              <!-- 定性分析 -->
              <div style="padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">定性分析</h2>
                <div style="font-size: 10px;">
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">要約</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.qualitative.summary)}
                    </p>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">感情</h3>
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; border: 1px solid rgba(255,255,255,0.2);">
                      ${analysis.result.qualitative.tone}
                    </span>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">想定ターゲット</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.qualitative.targetAudience)}
                    </p>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">メッセージの明確さ</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.qualitative.messageClarity)}
                    </p>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">感情的な訴求力</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.qualitative.emotionalAppeal)}
                    </p>
                  </div>
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">ブランドボイス</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.qualitative.brandVoice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 右カラム -->
            <div style="display: table-cell; width: 48%; vertical-align: top; padding-left: 4mm;">
              <!-- 意思決定判定 -->
              ${analysis.result.decision ? `
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">意思決定判定</h2>
                <div style="font-size: 10px;">
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">判定結果</h3>
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; ${analysis.result.decision.decision === "GO" ? "background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.5);" : analysis.result.decision.decision === "HOLD" ? "background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.5);" : "background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.5);"}">
                      ${analysis.result.decision.decision === "GO" ? "GO（出してよい）" : analysis.result.decision.decision === "HOLD" ? "HOLD（修正すれば可）" : "NO-GO（今回は出さない）"}
                    </span>
                  </div>
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">判定理由</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.decision.reason)}
                    </p>
                  </div>
                </div>
              </div>
              ` : ""}

              <!-- ブランドセーフティ評価 -->
              ${analysis.result.brandSafety ? `
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">ブランドセーフティ評価</h2>
                <div style="font-size: 10px;">
                  <div style="display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 2mm; margin-bottom: 3mm;">
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;">
                        <p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">トーン不整合</p>
                        <p style="font-size: 11px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.result.brandSafety.brandToneMismatch}</p>
                      </div>
                      <div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;">
                        <p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">炎上リスク</p>
                        <p style="font-size: 11px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.result.brandSafety.misunderstandingRisk}</p>
                      </div>
                    </div>
                    <div style="display: table-row;">
                      <div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;">
                        <p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">媒体ズレ</p>
                        <p style="font-size: 11px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.result.brandSafety.platformContextMismatch}</p>
                      </div>
                      <div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;">
                        <p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">トレードオフ</p>
                        <p style="font-size: 11px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.result.brandSafety.kpiTradeoff}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">注意点</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.brandSafety.overallCaution)}
                    </p>
                  </div>
                </div>
              </div>
              ` : ""}

              <!-- 定量分析 -->
              ${(analysis.impressions || analysis.reach || analysis.likes || analysis.comments || analysis.shares || analysis.saves || analysis.engagementRate !== null || analysis.result.quantitative) ? `
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">定量分析</h2>
                ${analysis.result.quantitative ? `
                <div style="margin-bottom: 3mm; font-size: 10px;">
                  ${analysis.result.quantitative.performanceSummary ? `<p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0 0 2mm 0; word-wrap: break-word;">${escapeHtml(analysis.result.quantitative.performanceSummary)}</p>` : ""}
                  ${analysis.result.quantitative.engagementAnalysis ? `<p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0 0 2mm 0; word-wrap: break-word;">${escapeHtml(analysis.result.quantitative.engagementAnalysis)}</p>` : ""}
                  ${analysis.result.quantitative.reachAnalysis ? `<p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0 0 2mm 0; word-wrap: break-word;">${escapeHtml(analysis.result.quantitative.reachAnalysis)}</p>` : ""}
                  ${analysis.result.quantitative.comparisonToAverage ? `<p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">${escapeHtml(analysis.result.quantitative.comparisonToAverage)}</p>` : ""}
                </div>
                ` : ""}
                <div style="display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 2mm;">
                  <div style="display: table-row;">
                    ${analysis.impressions ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">インプレッション</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.impressions.toLocaleString()}</p></div>` : ""}
                    ${analysis.reach ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">リーチ</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.reach.toLocaleString()}</p></div>` : ""}
                    ${analysis.engagementRate !== null && analysis.engagementRate !== undefined ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">エンゲージメント率</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.engagementRate.toFixed(2)}%</p></div>` : ""}
                  </div>
                  <div style="display: table-row;">
                    ${analysis.likes ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">いいね</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.likes.toLocaleString()}</p></div>` : ""}
                    ${analysis.comments ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">コメント</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.comments.toLocaleString()}</p></div>` : ""}
                    ${analysis.shares ? `<div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">シェア</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.shares.toLocaleString()}</p></div>` : ""}
                  </div>
                  ${analysis.saves ? `<div style="display: table-row;"><div style="display: table-cell; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; text-align: center;"><p style="font-size: 8px; text-transform: uppercase; color: #999; margin: 0 0 1mm 0;">保存</p><p style="font-size: 14px; color: #ffffff; margin: 0; font-weight: 300;">${analysis.saves.toLocaleString()}</p></div></div>` : ""}
                </div>
              </div>
              ` : ""}

              <!-- 改善提案 -->
              <div style="padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">改善提案</h2>
                <div style="font-size: 10px;">
                  ${analysis.result.improvements.contentImprovements && analysis.result.improvements.contentImprovements.length > 0 ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">コンテンツ改善</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      ${analysis.result.improvements.contentImprovements.map((improvement: string) => `<li style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 2mm; word-wrap: break-word;">${escapeHtml(improvement)}</li>`).join("")}
                    </ul>
                  </div>
                  ` : ""}
                  ${analysis.result.improvements.visualSuggestions ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">視覚的改善</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.improvements.visualSuggestions)}
                    </p>
                  </div>
                  ` : ""}
                  ${analysis.result.improvements.timingSuggestions ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">タイミング改善</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.improvements.timingSuggestions)}
                    </p>
                  </div>
                  ` : ""}
                  ${analysis.result.improvements.hashtagSuggestions && analysis.result.improvements.hashtagSuggestions.length > 0 ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">ハッシュタグ提案</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 2mm;">
                      ${analysis.result.improvements.hashtagSuggestions.map((hashtag: string) => `<span style="padding: 2px 6px; background: rgba(255,255,255,0.1); border-radius: 12px; font-size: 9px; border: 1px solid rgba(255,255,255,0.1);">#${hashtag}</span>`).join("")}
                    </div>
                  </div>
                  ` : ""}
                  ${analysis.result.improvements.nextPostRecommendations && analysis.result.improvements.nextPostRecommendations.length > 0 ? `
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">次回投稿の推奨事項</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      ${analysis.result.improvements.nextPostRecommendations.map((recommendation: string) => `<li style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 2mm; word-wrap: break-word;">${escapeHtml(recommendation)}</li>`).join("")}
                    </ul>
                  </div>
                  ` : ""}
                </div>
              </div>

              <!-- 却下理由（HOLDまたはNO-GOの場合のみ） -->
              ${analysis.result.rejectionReasons && (analysis.result.decision.decision === "HOLD" || analysis.result.decision.decision === "NO-GO") ? `
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">却下理由（用途別）</h2>
                <div style="font-size: 10px;">
                  ${analysis.result.rejectionReasons.forManagement ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">上長・役員向け</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.rejectionReasons.forManagement)}
                    </p>
                  </div>
                  ` : ""}
                  ${analysis.result.rejectionReasons.forBrand ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">広報・ブランド担当向け</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.rejectionReasons.forBrand)}
                    </p>
                  </div>
                  ` : ""}
                  ${analysis.result.rejectionReasons.forCreator ? `
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">制作者向け</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.rejectionReasons.forCreator)}
                    </p>
                  </div>
                  ` : ""}
                </div>
              </div>
              ` : ""}

              <!-- 判断ログ -->
              ${analysis.result.decisionLog ? `
              <div style="margin-bottom: 6mm; padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">判断ログ</h2>
                <div style="font-size: 10px;">
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">AIの示唆</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.decisionLog.aiInsight)}
                    </p>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">最終判断</h3>
                    <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; border: 1px solid rgba(255,255,255,0.2);">
                      ${analysis.result.decisionLog.finalDecision}
                    </span>
                  </div>
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">判断理由</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.decisionLog.decisionReason)}
                    </p>
                  </div>
                  ${analysis.result.decisionLog.nextKpis && analysis.result.decisionLog.nextKpis.length > 0 ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">次に見るべきKPI</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      ${analysis.result.decisionLog.nextKpis.map((kpi: string) => `<li style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 2mm; word-wrap: break-word;">${escapeHtml(kpi)}</li>`).join("")}
                    </ul>
                  </div>
                  ` : ""}
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">再評価タイミング</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.decisionLog.reevaluationTiming)}
                    </p>
                  </div>
                </div>
              </div>
              ` : ""}

              <!-- 次アクション指示 -->
              ${analysis.result.nextAction ? `
              <div style="padding: 4mm; background: rgba(255,255,255,0.05); border-radius: 4px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h2 style="font-size: 14px; font-weight: 300; margin: 0 0 3mm 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2mm;">次アクション指示</h2>
                <div style="font-size: 10px;">
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">次に行うべきアクション</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.nextAction.action)}
                    </p>
                  </div>
                  ${analysis.result.nextAction.successKpis && analysis.result.nextAction.successKpis.length > 0 ? `
                  <div style="margin-bottom: 3mm;">
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">成功・失敗を判断するKPI</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      ${analysis.result.nextAction.successKpis.map((kpi: string) => `<li style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin-bottom: 2mm; word-wrap: break-word;">${escapeHtml(kpi)}</li>`).join("")}
                    </ul>
                  </div>
                  ` : ""}
                  <div>
                    <h3 style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin: 0 0 1mm 0;">確認タイミング・担当者</h3>
                    <p style="color: #ffffff; line-height: 1.5; padding: 2mm; background: rgba(255,255,255,0.05); border-radius: 3px; margin: 0; word-wrap: break-word;">
                      ${escapeHtml(analysis.result.nextAction.reviewTiming)}
                    </p>
                  </div>
                </div>
              </div>
              ` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  if (status === "loading" || isLoading) {
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
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all"
            >
              ← 分析に戻る
            </Link>
            <h1 className="luxury-title text-3xl text-white">
              分析履歴
            </h1>
            <div className="w-24"></div>
          </div>
          
          {/* 選択とPDF生成ボタン */}
          {analyses.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all"
              >
                {selectedIds.size === analyses.length ? "すべて解除" : "すべて選択"}
              </button>
              <button
                onClick={generatePDF}
                disabled={selectedIds.size === 0 || isGeneratingPDF}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs font-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    PDF生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDFレポート生成 ({selectedIds.size})
                  </>
                )}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-gray-400 text-xs font-light">
                  {selectedIds.size}件選択中
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {analyses.length === 0 ? (
          <div className="glass-card-strong rounded-lg p-12 text-center">
            <p className="text-gray-400 text-sm">まだ分析履歴がありません</p>
            <Link
              href="/"
              className="mt-4 inline-block px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-light transition-all"
            >
              分析を開始
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 投稿後の分析セクション */}
            {postPostAnalyses.length > 0 && (
              <div>
                <h2 className="text-xl text-white mb-4 font-light flex items-center gap-2">
                  <span className="w-1 h-6 bg-green-500/50 rounded"></span>
                  投稿後の分析
                </h2>
                <div className="max-h-[616px] overflow-y-auto space-y-2 pr-2">
                  {postPostAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="glass-card-strong rounded-lg p-4 hover-lift border-t border-green-500/30 transition-all relative h-24 flex items-center"
                    >
                      {/* 画像・動画サムネイルとチェックボックス */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10 flex items-center gap-2">
                        {/* 画像または動画のサムネイル */}
                        {(analysis.imageBase64 || analysis.videoBase64) && (
                          <div className="w-12 h-12 rounded border border-white/10 overflow-hidden flex-shrink-0">
                            {analysis.imageBase64 ? (
                              <img
                                src={`data:${analysis.imageMimeType || "image/jpeg"};base64,${analysis.imageBase64}`}
                                alt="投稿画像"
                                className="w-full h-full object-cover"
                              />
                            ) : analysis.videoBase64 ? (
                              <div className="w-full h-full bg-black/30 flex items-center justify-center relative">
                                <video
                                  src={`data:${analysis.videoMimeType || "video/mp4"};base64,${analysis.videoBase64}`}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {/* チェックボックス */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(analysis.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(analysis.id)}
                            onChange={() => toggleSelection(analysis.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 cursor-pointer accent-white/20"
                          />
                        </div>
                      </div>
                      
                      <div
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="cursor-pointer w-full pr-28"
                      >
                        {/* 分析日時・プラットフォーム・投稿テキスト */}
                        <div className="flex items-center gap-4 h-full">
                          <div className="flex-shrink-0 w-44">
                            <div className="text-gray-400 text-xs font-light mb-1">
                              {formatDate(analysis.createdAt)}
                            </div>
                            {analysis.platform && (
                              <span className="px-2 py-1 bg-white/10 rounded text-white text-xs font-light inline-block">
                                {analysis.platform}
                                {analysis.platformType && ` (${analysis.platformType})`}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-light truncate">
                              {analysis.postText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 投稿前の分析セクション */}
            {prePostAnalyses.length > 0 && (
              <div>
                <h2 className="text-xl text-white mb-4 font-light flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500/50 rounded"></span>
                  投稿前の分析
                </h2>
                <div className="max-h-[616px] overflow-y-auto space-y-2 pr-2">
                  {prePostAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="glass-card-strong rounded-lg p-4 hover-lift border-t border-blue-500/30 transition-all relative h-24 flex items-center"
                    >
                      {/* 画像・動画サムネイルとチェックボックス */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10 flex items-center gap-2">
                        {/* 画像または動画のサムネイル */}
                        {(analysis.imageBase64 || analysis.videoBase64) && (
                          <div className="w-12 h-12 rounded border border-white/10 overflow-hidden flex-shrink-0">
                            {analysis.imageBase64 ? (
                              <img
                                src={`data:${analysis.imageMimeType || "image/jpeg"};base64,${analysis.imageBase64}`}
                                alt="投稿画像"
                                className="w-full h-full object-cover"
                              />
                            ) : analysis.videoBase64 ? (
                              <div className="w-full h-full bg-black/30 flex items-center justify-center relative">
                                <video
                                  src={`data:${analysis.videoMimeType || "video/mp4"};base64,${analysis.videoBase64}`}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                        {/* チェックボックス */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(analysis.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(analysis.id)}
                            onChange={() => toggleSelection(analysis.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 cursor-pointer accent-white/20"
                          />
                        </div>
                      </div>
                      
                      <div
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="cursor-pointer w-full pr-28"
                      >
                        {/* 分析日時・プラットフォーム・投稿テキスト */}
                        <div className="flex items-center gap-4 h-full">
                          <div className="flex-shrink-0 w-44">
                            <div className="text-gray-400 text-xs font-light mb-1">
                              {formatDate(analysis.createdAt)}
                            </div>
                            {analysis.platform && (
                              <span className="px-2 py-1 bg-white/10 rounded text-white text-xs font-light inline-block">
                                {analysis.platform}
                                {analysis.platformType && ` (${analysis.platformType})`}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-light truncate">
                              {analysis.postText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* PDF生成用の非表示コンテナ */}
        <div ref={pdfContainerRef} style={{ position: "absolute", left: "-9999px", top: "-9999px" }}></div>

        {/* 分析結果詳細モーダル */}
        {selectedAnalysis && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnalysis(null)}
          >
            <div
              className="glass-card-strong rounded-lg p-6 max-w-7xl w-full h-[95vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 閉じるボタン */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="luxury-title text-xl text-white">分析結果</h2>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-light transition-all"
                >
                  閉じる
                </button>
              </div>

              {/* 2カラムレイアウト */}
              <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden min-h-0">
                {/* 左カラム - 分析結果 */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 min-h-0">
                  {/* 元の投稿内容 */}
                  <div className="glass-card-strong rounded-lg p-4 border-t border-white/10">
                    <h3 className="text-white mb-3 font-light text-base">投稿内容</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedAnalysis.platform && (
                        <span className="px-2 py-1 bg-white/10 rounded text-white text-xs font-light">
                          {selectedAnalysis.platform}
                          {selectedAnalysis.platformType && ` (${selectedAnalysis.platformType})`}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs font-light">
                        {formatDate(selectedAnalysis.createdAt)}
                      </span>
                    </div>
                    <p className="text-white text-xs font-light mb-3 whitespace-pre-wrap">
                      {selectedAnalysis.postText}
                    </p>
                    {selectedAnalysis.imageBase64 && (
                      <div className="mt-2">
                        <img
                          src={`data:${selectedAnalysis.imageMimeType || "image/jpeg"};base64,${selectedAnalysis.imageBase64}`}
                          alt="投稿画像"
                          className="w-full max-h-48 object-contain rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                    {selectedAnalysis.videoBase64 && !selectedAnalysis.imageBase64 && (
                      <div className="mt-2">
                        <video
                          src={`data:${selectedAnalysis.videoMimeType || "video/mp4"};base64,${selectedAnalysis.videoBase64}`}
                          controls
                          className="w-full max-h-48 rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>

                  {/* 定性分析セクション */}
                  <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                    <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
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

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">要約</h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                          {selectedAnalysis.result.qualitative.summary}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">感情</h4>
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${getToneColor(
                            selectedAnalysis.result.qualitative.tone
                          )}`}
                        >
                          {selectedAnalysis.result.qualitative.tone}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                          想定ターゲット
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                          {selectedAnalysis.result.qualitative.targetAudience}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                          メッセージの明確さ
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                          {selectedAnalysis.result.qualitative.messageClarity}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                          感情的な訴求力
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                          {selectedAnalysis.result.qualitative.emotionalAppeal}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                          ブランドボイス
                        </h4>
                        <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                          {selectedAnalysis.result.qualitative.brandVoice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 定量分析セクション */}
                  {(selectedAnalysis.impressions || selectedAnalysis.reach || selectedAnalysis.likes || selectedAnalysis.comments || selectedAnalysis.shares || selectedAnalysis.saves || selectedAnalysis.engagementRate !== null || selectedAnalysis.result.quantitative) && (
                    <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                      <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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

                      {selectedAnalysis.result.quantitative && (
                        <div className="mb-3 space-y-2">
                          {selectedAnalysis.result.quantitative.performanceSummary && (
                            <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                              {selectedAnalysis.result.quantitative.performanceSummary}
                            </p>
                          )}
                          {selectedAnalysis.result.quantitative.engagementAnalysis && (
                            <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                              {selectedAnalysis.result.quantitative.engagementAnalysis}
                            </p>
                          )}
                          {selectedAnalysis.result.quantitative.reachAnalysis && (
                            <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                              {selectedAnalysis.result.quantitative.reachAnalysis}
                            </p>
                          )}
                          {selectedAnalysis.result.quantitative.comparisonToAverage && (
                            <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                              {selectedAnalysis.result.quantitative.comparisonToAverage}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        {selectedAnalysis.impressions && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">インプレッション</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.impressions.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.reach && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">リーチ</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.reach.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.engagementRate !== null && selectedAnalysis.engagementRate !== undefined && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">エンゲージメント率</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.engagementRate.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.likes && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">いいね</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.likes.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.comments && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">コメント</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.comments.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.shares && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">シェア</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.shares.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAnalysis.saves && (
                          <div className="bg-white/5 rounded-lg p-2">
                            <p className="text-gray-400 text-xs mb-1 font-light uppercase tracking-wider">保存</p>
                            <p className="text-white text-lg font-light">
                              {selectedAnalysis.saves.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 改善提案セクション */}
                  <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                    <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                      <svg
                        className="w-5 h-5 text-gray-400"
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
                      改善提案
                    </h3>

                    <div className="space-y-3">
                      {selectedAnalysis.result.improvements.contentImprovements &&
                        selectedAnalysis.result.improvements.contentImprovements.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">コンテンツ改善</h4>
                            <ul className="space-y-1.5">
                              {selectedAnalysis.result.improvements.contentImprovements.map((improvement, index) => (
                                <li key={index} className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {selectedAnalysis.result.improvements.visualSuggestions && (
                        <div>
                          <h4 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">視覚的改善</h4>
                          <p className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.improvements.visualSuggestions}
                          </p>
                        </div>
                      )}

                      {selectedAnalysis.result.improvements.timingSuggestions && (
                        <div>
                          <h4 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">タイミング改善</h4>
                          <p className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.improvements.timingSuggestions}
                          </p>
                        </div>
                      )}

                      {selectedAnalysis.result.improvements.hashtagSuggestions &&
                        selectedAnalysis.result.improvements.hashtagSuggestions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">ハッシュタグ提案</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAnalysis.result.improvements.hashtagSuggestions.map((hashtag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-white/10 rounded-full text-white text-xs font-light border border-white/10"
                                >
                                  #{hashtag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedAnalysis.result.improvements.nextPostRecommendations &&
                        selectedAnalysis.result.improvements.nextPostRecommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-300 mb-2 text-xs uppercase tracking-wider">次回投稿の推奨事項</h4>
                            <ul className="space-y-1.5">
                              {selectedAnalysis.result.improvements.nextPostRecommendations.map((recommendation, index) => (
                                <li key={index} className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                  {recommendation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* 右カラム - 意思決定結果 */}
                <div className="flex flex-col gap-4 overflow-y-auto pl-2 min-h-0">
                  {/* 意思決定判定セクション */}
                  {selectedAnalysis.result.decision && (
                    <div className="glass-card-strong rounded-lg p-4 border-t border-white/10">
                      <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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
                      <div className="space-y-3">
                        <div>
                          <span
                            className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold border-2 ${
                              selectedAnalysis.result.decision.decision === "GO"
                                ? "bg-green-500/20 border-green-500/50 text-green-300"
                                : selectedAnalysis.result.decision.decision === "HOLD"
                                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                                : "bg-red-500/20 border-red-500/50 text-red-300"
                            }`}
                          >
                            {selectedAnalysis.result.decision.decision === "GO"
                              ? "GO（出してよい）"
                              : selectedAnalysis.result.decision.decision === "HOLD"
                              ? "HOLD（修正すれば可）"
                              : "NO-GO（今回は出さない）"}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">判定理由</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.decision.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ブランドセーフティ評価セクション */}
                  {selectedAnalysis.result.brandSafety && (
                    <div className="glass-card-strong rounded-lg p-4 border-t border-white/10">
                      <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg p-2">
                            <h4 className="font-medium text-gray-300 mb-1 text-xs uppercase tracking-wider">トーン不整合</h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedAnalysis.result.brandSafety.brandToneMismatch === "低"
                                  ? "bg-green-500/20 text-green-300"
                                  : selectedAnalysis.result.brandSafety.brandToneMismatch === "中"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {selectedAnalysis.result.brandSafety.brandToneMismatch}
                            </span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <h4 className="font-medium text-gray-300 mb-1 text-xs uppercase tracking-wider">炎上リスク</h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedAnalysis.result.brandSafety.misunderstandingRisk === "低"
                                  ? "bg-green-500/20 text-green-300"
                                  : selectedAnalysis.result.brandSafety.misunderstandingRisk === "中"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {selectedAnalysis.result.brandSafety.misunderstandingRisk}
                            </span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <h4 className="font-medium text-gray-300 mb-1 text-xs uppercase tracking-wider">媒体ズレ</h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedAnalysis.result.brandSafety.platformContextMismatch === "低"
                                  ? "bg-green-500/20 text-green-300"
                                  : selectedAnalysis.result.brandSafety.platformContextMismatch === "中"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {selectedAnalysis.result.brandSafety.platformContextMismatch}
                            </span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <h4 className="font-medium text-gray-300 mb-1 text-xs uppercase tracking-wider">トレードオフ</h4>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedAnalysis.result.brandSafety.kpiTradeoff === "低"
                                  ? "bg-green-500/20 text-green-300"
                                  : selectedAnalysis.result.brandSafety.kpiTradeoff === "中"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {selectedAnalysis.result.brandSafety.kpiTradeoff}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">注意点</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.brandSafety.overallCaution}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 却下理由セクション（HOLDまたはNO-GOの場合のみ） */}
                  {selectedAnalysis.result.rejectionReasons &&
                    (selectedAnalysis.result.decision.decision === "HOLD" ||
                      selectedAnalysis.result.decision.decision === "NO-GO") && (
                      <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                        <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                          <svg
                            className="w-5 h-5 text-gray-400"
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

                        <div className="space-y-3">
                          {selectedAnalysis.result.rejectionReasons.forManagement && (
                            <div>
                              <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                                上長・役員向け
                              </h4>
                              <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                {selectedAnalysis.result.rejectionReasons.forManagement}
                              </p>
                            </div>
                          )}

                          {selectedAnalysis.result.rejectionReasons.forBrand && (
                            <div>
                              <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                                広報・ブランド担当向け
                              </h4>
                              <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                {selectedAnalysis.result.rejectionReasons.forBrand}
                              </p>
                            </div>
                          )}

                          {selectedAnalysis.result.rejectionReasons.forCreator && (
                            <div>
                              <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">
                                制作者向け
                              </h4>
                              <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                {selectedAnalysis.result.rejectionReasons.forCreator}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* 判断ログセクション */}
                  {selectedAnalysis.result.decisionLog && (
                    <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                      <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">AIの示唆</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.decisionLog.aiInsight}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">最終判断</h4>
                          <span
                            className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${
                              selectedAnalysis.result.decisionLog.finalDecision === "GO"
                                ? "bg-green-500/20 border-green-500/50 text-green-300"
                                : selectedAnalysis.result.decisionLog.finalDecision === "HOLD"
                                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                                : "bg-red-500/20 border-red-500/50 text-red-300"
                            }`}
                          >
                            {selectedAnalysis.result.decisionLog.finalDecision}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">判断理由</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.decisionLog.decisionReason}
                          </p>
                        </div>

                        {selectedAnalysis.result.decisionLog.nextKpis &&
                          selectedAnalysis.result.decisionLog.nextKpis.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">次に見るべきKPI</h4>
                              <ul className="space-y-1.5">
                                {selectedAnalysis.result.decisionLog.nextKpis.map((kpi, index) => (
                                  <li key={index} className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                    {kpi}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">再評価タイミング</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.decisionLog.reevaluationTiming}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 次アクション指示セクション */}
                  {selectedAnalysis.result.nextAction && (
                    <div className="glass-card-strong rounded-lg p-4 hover-lift border-t border-white/10">
                      <h3 className="text-base font-medium text-white mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                        <svg
                          className="w-5 h-5 text-gray-400"
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

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">次に行うべきアクション</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.nextAction.action}
                          </p>
                        </div>

                        {selectedAnalysis.result.nextAction.successKpis &&
                          selectedAnalysis.result.nextAction.successKpis.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">成功・失敗を判断するKPI</h4>
                              <ul className="space-y-1.5">
                                {selectedAnalysis.result.nextAction.successKpis.map((kpi, index) => (
                                  <li key={index} className="text-gray-200 bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                                    {kpi}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        <div>
                          <h4 className="font-medium text-gray-300 mb-1.5 text-xs uppercase tracking-wider">確認タイミング・担当者</h4>
                          <p className="text-gray-200 leading-relaxed bg-white/5 rounded-lg p-2 backdrop-blur-sm font-light text-xs">
                            {selectedAnalysis.result.nextAction.reviewTiming}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
