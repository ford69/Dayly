import request from "supertest";
import { createApp } from "../src/app";

describe("GET /api/health", () => {
  it("should return ok: true", async () => {
    process.env.MONGODB_URI = "test";
    process.env.JWT_SECRET = "test";
    const app = createApp();

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
