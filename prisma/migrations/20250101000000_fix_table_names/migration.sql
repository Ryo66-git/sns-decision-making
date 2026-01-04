-- Drop existing tables with incorrect casing (if they exist)
-- This is safe for new deployments or when data can be reset
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Analysis" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;

-- Also drop lowercase versions if they exist (to ensure clean state)
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS "analysis" CASCADE;
DROP TABLE IF EXISTS "password_reset_token" CASCADE;

-- CreateTable (PostgreSQL compatible)
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT,
    "platformType" TEXT,
    "postText" TEXT NOT NULL,
    "imageBase64" TEXT,
    "imageMimeType" TEXT,
    "videoBase64" TEXT,
    "videoMimeType" TEXT,
    "impressions" INTEGER,
    "reach" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "analysis_userId_idx" ON "analysis"("userId");

-- CreateIndex
CREATE INDEX "analysis_createdAt_idx" ON "analysis"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_token_idx" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_userId_idx" ON "password_reset_token"("userId");

-- CreateIndex
CREATE INDEX "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

-- AddForeignKey
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

