import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendProfessorReviewEmail } from "./server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendProfessorReviewEmail", () => {
  it("sends nothing without Resend configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendProfessorReviewEmail("p@example.com", "Pat", "approved", null)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the rejection reason to Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "ThoraxScan <no-reply@example.com>");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendProfessorReviewEmail("p@example.com", "Pat", "rejected", "Not <b>faculty</b>")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body);
    expect(body.to).toBe("p@example.com");
    expect(body.text).toContain("Reason: Not <b>faculty</b>");
    expect(body.html).toContain("Not &lt;b&gt;faculty&lt;/b&gt;");
  });
});
