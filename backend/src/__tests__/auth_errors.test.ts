import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { requireAuth } from "../middleware/auth.middleware.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { signAccessToken } from "../lib/jwt.js";

function createMockReqRes(headers: Record<string, string> = {}) {
  let statusCode = 200;
  let jsonPayload: any = null;
  const req: any = {
    headers,
    user: undefined,
  };
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      jsonPayload = data;
      return this;
    },
  };
  return { req, res, getStatusCode: () => statusCode, getJsonPayload: () => jsonPayload };
}

describe("Authentication & Security Error Handling Audit", () => {
  describe("requireAuth Middleware", () => {
    test("rejects request when Authorization header is missing", () => {
      const { req, res, getStatusCode, getJsonPayload } = createMockReqRes({});
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(getStatusCode(), 401);
      assert.equal(getJsonPayload().error, "Authentication required.");
    });

    test("rejects request when Authorization header is not Bearer format", () => {
      const { req, res, getStatusCode, getJsonPayload } = createMockReqRes({
        authorization: "Basic dXNlcjpwYXNz",
      });
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(getStatusCode(), 401);
      assert.equal(getJsonPayload().error, "Authentication required.");
    });

    test("rejects request when Bearer token is malformed or invalid", () => {
      const { req, res, getStatusCode, getJsonPayload } = createMockReqRes({
        authorization: "Bearer invalid.jwt.token",
      });
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
      assert.equal(getStatusCode(), 401);
      assert.equal(getJsonPayload().error, "Invalid or expired authentication token.");
    });

    test("authenticates request and populates req.user when Bearer token is valid", () => {
      const token = signAccessToken({
        userId: "user-123",
        businessId: "biz-456",
        role: "OWNER",
      });

      const { req, res } = createMockReqRes({
        authorization: `Bearer ${token}`,
      });
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.user.id, "user-123");
      assert.equal(req.user.businessId, "biz-456");
      assert.equal(req.user.role, "OWNER");
    });
  });

  describe("Production Error Sanitization", () => {
    test("hides internal stack trace in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        const { req, res, getStatusCode, getJsonPayload } = createMockReqRes();
        const internalError = new Error("FATAL DB: postgres://user:secret@db.internal:5432/db");

        errorHandler(internalError, req, res, () => {});

        assert.equal(getStatusCode(), 500);
        assert.equal(getJsonPayload().error, "Internal server error.");
        assert.equal(getJsonPayload().stack, undefined, "Stack trace must not be exposed in production");
        assert.equal(getJsonPayload().details, undefined);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
