import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      verifyOtp: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null } }),
    },
  }),
}));

const origin = "https://app.example";

async function redirectFor(next: string) {
  const url = new URL("/auth/confirm?token_hash=t&type=signup", origin);
  url.searchParams.set("next", next);
  return (await GET(new NextRequest(url))).headers.get("location");
}

it.each(["/dashboard", "/reset-password"])("keeps the in-app destination %j", async (next) => {
  expect(await redirectFor(next)).toBe(`${origin}${next}`);
});

it.each(["//evil.com", "/\\evil.com", "/\\/evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com", "//["])(
  "sends the off-site destination %j to the dashboard",
  async (next) => {
    expect(await redirectFor(next)).toBe(`${origin}/dashboard`);
  },
);
