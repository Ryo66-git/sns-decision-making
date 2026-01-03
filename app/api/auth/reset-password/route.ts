"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) {
    return { error: "すべての項目を入力してください" };
  }

  if (password !== confirmPassword) {
    return { error: "パスワードが一致しません" };
  }

  if (password.length < 6) {
    return { error: "パスワードは6文字以上で入力してください" };
  }

  // トークンを検証
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { error: "無効なトークンです" };
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    return { error: "トークンの有効期限が切れています" };
  }

  // パスワードを更新
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // 使用済みトークンを削除
  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id },
  });

  // 同じユーザーの他のトークンも削除
  await prisma.passwordResetToken.deleteMany({
    where: { userId: resetToken.userId },
  });

  redirect("/auth/signin?reset=true");
}

