"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "メールアドレスを入力してください" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // セキュリティのため、ユーザーが存在しない場合でも成功メッセージを返す
  if (!user) {
    return { success: true };
  }

  // 既存のトークンを削除（期限切れのものと、まだ有効なものも含めて）
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // 新しいトークンを生成
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24時間有効

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // パスワードリセットメールを送信
  try {
    await sendPasswordResetEmail(user.email, token);
    console.log(`Password reset email sent successfully to ${user.email}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // SMTP設定関連のエラー
      if (error.message.includes("SMTP") || error.message.includes("credentials") || error.message.includes("transporter not configured")) {
        console.error("SMTP configuration error. Please check environment variables:");
        console.error("- SMTP_HOST:", process.env.SMTP_HOST || "not set");
        console.error("- SMTP_PORT:", process.env.SMTP_PORT || "not set");
        console.error("- SMTP_USER:", process.env.SMTP_USER ? "set" : "not set");
        console.error("- SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "set" : "not set");
        return { 
          error: "メール送信の設定が正しくありません。.env.localファイルにSMTP設定を追加してください。\n\n必要な設定:\n- SMTP_HOST\n- SMTP_PORT\n- SMTP_USER\n- SMTP_PASSWORD" 
        };
      }
      
      // 認証エラー
      if (error.message.includes("Authentication") || error.message.includes("Invalid login")) {
        return { error: "メール認証に失敗しました。SMTP_USERとSMTP_PASSWORDを確認してください。" };
      }
      
      // 接続エラー
      if (error.message.includes("Connection") || error.message.includes("timeout")) {
        return { error: "メールサーバーに接続できませんでした。SMTP_HOSTとSMTP_PORTを確認してください。" };
      }
    }
    return { error: `メールの送信に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}` };
  }

  return { success: true };
}

