import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGithubSignature } from "@/integrations/github/signature";

describe("GitHub webhook signatures", () => {
  it("accepts only a matching HMAC over the raw body", () => {
    const body = Buffer.from('{"action":"opened"}');
    const signature = `sha256=${createHmac("sha256", "test-secret").update(body).digest("hex")}`;
    expect(verifyGithubSignature(body, signature, "test-secret")).toBe(true);
    expect(
      verifyGithubSignature(
        Buffer.from('{"action":"closed"}'),
        signature,
        "test-secret",
      ),
    ).toBe(false);
    expect(verifyGithubSignature(body, null, "test-secret")).toBe(false);
  });
});
