-- Add columns for auth image URL and homepage title highlight
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "auth_image_url" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homepage_title_highlight" TEXT;

