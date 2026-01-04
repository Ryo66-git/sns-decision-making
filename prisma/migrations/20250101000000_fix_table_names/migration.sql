-- Rename existing tables if they exist (with different casing) to lowercase
DO $$ 
BEGIN
    -- Rename User to user if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
        ALTER TABLE "User" RENAME TO "user";
    END IF;
    
    -- Rename Analysis to analysis if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Analysis') THEN
        ALTER TABLE "Analysis" RENAME TO "analysis";
    END IF;
    
    -- Rename PasswordResetToken to password_reset_token if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'PasswordResetToken') THEN
        ALTER TABLE "PasswordResetToken" RENAME TO "password_reset_token";
    END IF;
END $$;

-- CreateTable (PostgreSQL compatible) - only if it doesn't exist
CREATE TABLE IF NOT EXISTS "user" (
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

-- CreateTable - only if it doesn't exist
CREATE TABLE IF NOT EXISTS "analysis" (
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

-- CreateTable - only if it doesn't exist
CREATE TABLE IF NOT EXISTS "password_reset_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex - only if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");

-- CreateIndex - only if it doesn't exist
CREATE INDEX IF NOT EXISTS "analysis_userId_idx" ON "analysis"("userId");

-- CreateIndex - only if it doesn't exist
CREATE INDEX IF NOT EXISTS "analysis_createdAt_idx" ON "analysis"("createdAt");

-- CreateIndex - only if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_token_token_key" ON "password_reset_token"("token");

-- CreateIndex - only if it doesn't exist
CREATE INDEX IF NOT EXISTS "password_reset_token_token_idx" ON "password_reset_token"("token");

-- CreateIndex - only if it doesn't exist
CREATE INDEX IF NOT EXISTS "password_reset_token_userId_idx" ON "password_reset_token"("userId");

-- CreateIndex - only if it doesn't exist
CREATE INDEX IF NOT EXISTS "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

-- AddForeignKey - only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'analysis_userId_fkey'
    ) THEN
        ALTER TABLE "analysis" ADD CONSTRAINT "analysis_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'password_reset_token_userId_fkey'
    ) THEN
        ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

