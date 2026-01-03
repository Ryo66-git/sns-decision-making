import nodemailer from "nodemailer";

// SMTP設定の検証
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.error("SMTP credentials not configured");
    console.error("Required environment variables:");
    console.error("  - SMTP_USER: " + (user ? "✓ set" : "✗ not set"));
    console.error("  - SMTP_PASSWORD: " + (pass ? "✓ set" : "✗ not set"));
    console.error("  - SMTP_HOST: " + (process.env.SMTP_HOST || "using default (smtp.gmail.com)"));
    console.error("  - SMTP_PORT: " + (process.env.SMTP_PORT || "using default (587)"));
    return null;
  }

  console.log("SMTP transporter created with:", {
    host,
    port,
    secure,
    user: user.substring(0, 3) + "***", // セキュリティのため一部のみ表示
  });

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // 接続テストを有効化
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

const transporter = createTransporter();

export async function sendWelcomeEmail(email: string, name: string | null) {
  // 開発環境でメール送信をスキップするオプション
  if (process.env.SKIP_EMAIL_SENDING === "true") {
    console.log("⚠️ メール送信がスキップされました（開発モード）");
    console.log(`📧 ウェルカムメールが ${email} に送信されるはずでした`);
    return;
  }

  if (!transporter) {
    console.error("SMTP transporter not configured. Email not sent.");
    throw new Error("SMTP transporter not configured");
  }

  const fromName = process.env.SMTP_FROM_NAME || "SNS投稿 意思決定ツール";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const from = fromEmail ? `${fromName} <${fromEmail}>` : fromName;

  const mailOptions = {
    from: from,
    to: email,
    subject: "SNS投稿 意思決定ツールへようこそ",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SNS投稿 意思決定ツール</h1>
          </div>
          <div class="content">
            <h2>登録ありがとうございます！</h2>
            <p>${name ? `${name}様、` : ""}この度はSNS投稿 意思決定ツールにご登録いただき、誠にありがとうございます。</p>
            <p>本サービスでは、AIを活用してSNS投稿を定性・定量分析し、次回投稿の改善案を提供いたします。</p>
            <p>以下のボタンからログインして、早速分析を始めてください。</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/signin" class="button">ログインする</a>
            </div>
            <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          </div>
          <div class="footer">
            <p>このメールは自動送信されています。</p>
            <p>&copy; ${new Date().getFullYear()} SNS投稿 意思決定ツール</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // 開発環境でメール送信をスキップするオプション
  if (process.env.SKIP_EMAIL_SENDING === "true") {
    console.log("⚠️ メール送信がスキップされました（開発モード）");
    console.log("📧 パスワードリセットリンク:");
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
    console.log(resetUrl);
    return;
  }

  if (!transporter) {
    console.error("SMTP transporter not configured. Email not sent.");
    throw new Error("SMTP transporter not configured");
  }

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;

  const fromName = process.env.SMTP_FROM_NAME || "SNS投稿 意思決定ツール";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const from = fromEmail ? `${fromName} <${fromEmail}>` : fromName;

  const mailOptions = {
    from: from,
    to: email,
    subject: "パスワードリセットのご案内",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>パスワードリセット</h1>
          </div>
          <div class="content">
            <h2>パスワードリセットのご案内</h2>
            <p>パスワードリセットのリクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">パスワードをリセット</a>
            </div>
            <div class="warning">
              <p><strong>注意事項：</strong></p>
              <ul>
                <li>このリンクは24時間有効です</li>
                <li>このリンクは1回のみ使用できます</li>
                <li>このリクエストをしていない場合は、このメールを無視してください</li>
              </ul>
            </div>
            <p>ボタンがクリックできない場合は、以下のURLをコピーしてブラウザに貼り付けてください：</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>このメールは自動送信されています。</p>
            <p>&copy; ${new Date().getFullYear()} SNS投稿 意思決定ツール</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    console.log("Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

