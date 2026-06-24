/*
  # Create users table

  Stores application users for Express JWT auth (email/password + Google OAuth).
  The backend connects with the Supabase service role key, which bypasses RLS.
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
