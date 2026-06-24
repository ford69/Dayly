import request from "supertest";
import { createApp } from "../src/app";

describe("GET /api/health", () => {
  it("should return ok: true", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
    process.env.JWT_SECRET = "test";
    const app = createApp();

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
