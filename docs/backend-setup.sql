-- SQL commands to set up the necessary Storage buckets and RLS policies.
-- This file should be executed in your Supabase project's SQL editor.

-- 1. Create Storage Bucket for Proofs
-- This bucket will store all the uploaded proof images and documents.
-- We make it public so that images can be easily displayed in the app,
-- but access will be controlled by Row Level Security policies.
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Allow authenticated users to upload proofs
-- This policy allows any logged-in user to upload files to the 'proofs' bucket.
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'proofs' );

-- 3. RLS Policy: Allow users to view their own uploaded proofs
-- This policy ensures that a user can only read/view files that they themselves have uploaded.
-- The file's owner is recorded in the object's `owner` column, which corresponds to the user's UID.
CREATE POLICY "Allow individual read access on own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING ( auth.uid() = owner );

-- Note: You might want to add policies for UPDATE and DELETE based on your app's requirements.
-- For example, you might want to allow users to delete their own proofs.
--
-- CREATE POLICY "Allow individual delete on own proofs"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING ( auth.uid() = owner );
