import dotenv from "dotenv";

dotenv.config();

export function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5174),
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? "",
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ?? "",
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ?? "My Daily Planner",
};
