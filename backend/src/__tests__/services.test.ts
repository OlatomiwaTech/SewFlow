import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import { formatOrderSummary } from "../services/order.service.js";
import { getStockStatus, formatMaterialSummary } from "../services/inventory.service.js";
import { errorHandler, AppError } from "../middleware/errorHandler.js";

describe("Service Logic & Middleware Audit", () => {
  describe("Order Summary & Financial Calculations", () => {
    const dummyCustomer = {
      id: "cust-1",
      businessId: "biz-1",
      firstName: "John",
      lastName: "Doe",
      phone: "+234800000000",
      email: null,
      address: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("calculates UNPAID status when no payments exist", () => {
      const mockOrder: any = {
        id: "order-1",
        customerId: "cust-1",
        garmentType: "Suit",
        description: null,
        quantity: 1,
        totalAmount: new Prisma.Decimal(50000),
        depositAmount: new Prisma.Decimal(0),
        status: "NEW",
        priority: "MEDIUM",
        orderDate: new Date(),
        expectedDate: null,
        deliveredAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: dummyCustomer,
        payments: [],
        history: [],
      };

      const summary = formatOrderSummary(mockOrder);
      assert.equal(summary.totalPaid, 0);
      assert.equal(summary.balanceDue, 50000);
      assert.equal(summary.paymentStatus, "UNPAID");
    });

    test("calculates PARTIALLY_PAID status with exact rounded decimal sum", () => {
      const mockOrder: any = {
        id: "order-2",
        customerId: "cust-1",
        garmentType: "Suit",
        description: null,
        quantity: 1,
        totalAmount: new Prisma.Decimal(100000),
        depositAmount: new Prisma.Decimal(30000),
        status: "NEW",
        priority: "MEDIUM",
        orderDate: new Date(),
        expectedDate: null,
        deliveredAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: dummyCustomer,
        payments: [
          { id: "p1", orderId: "order-2", amount: new Prisma.Decimal(30000.50), method: "CASH", reference: null, paymentDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date() },
          { id: "p2", orderId: "order-2", amount: new Prisma.Decimal(20000.25), method: "CARD", reference: null, paymentDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date() },
        ],
        history: [],
      };

      const summary = formatOrderSummary(mockOrder);
      assert.equal(summary.totalPaid, 50000.75);
      assert.equal(summary.balanceDue, 49999.25);
      assert.equal(summary.paymentStatus, "PARTIALLY_PAID");
    });

    test("calculates PAID status when total payments equal total amount", () => {
      const mockOrder: any = {
        id: "order-3",
        customerId: "cust-1",
        garmentType: "Suit",
        description: null,
        quantity: 1,
        totalAmount: new Prisma.Decimal(45000),
        depositAmount: new Prisma.Decimal(45000),
        status: "READY",
        priority: "HIGH",
        orderDate: new Date(),
        expectedDate: null,
        deliveredAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: dummyCustomer,
        payments: [
          { id: "p1", orderId: "order-3", amount: new Prisma.Decimal(45000), method: "POS", reference: null, paymentDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date() },
        ],
        history: [],
      };

      const summary = formatOrderSummary(mockOrder);
      assert.equal(summary.totalPaid, 45000);
      assert.equal(summary.balanceDue, 0);
      assert.equal(summary.paymentStatus, "PAID");
    });
  });

  describe("Inventory Stock Status & Valuation", () => {
    test("categorizes OUT_OF_STOCK when quantity is zero or negative", () => {
      assert.equal(getStockStatus(0, 10), "OUT_OF_STOCK");
      assert.equal(getStockStatus(-5, 10), "OUT_OF_STOCK");
    });

    test("categorizes LOW_STOCK when quantity is less than or equal to minimumStockLevel", () => {
      assert.equal(getStockStatus(5, 10), "LOW_STOCK");
      assert.equal(getStockStatus(10, 10), "LOW_STOCK");
    });

    test("categorizes IN_STOCK when quantity exceeds minimumStockLevel", () => {
      assert.equal(getStockStatus(15, 10), "IN_STOCK");
    });

    test("formatMaterialSummary formats numbers and calculates estimated value", () => {
      const mockMaterial: any = {
        id: "mat-1",
        businessId: "biz-1",
        sku: "FAB-001",
        name: "Cashmere Wool",
        description: null,
        category: "FABRIC",
        unit: "YARD",
        currentQuantity: new Prisma.Decimal(25.5),
        minimumStockLevel: new Prisma.Decimal(5),
        costPerUnit: new Prisma.Decimal(4000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      const summary = formatMaterialSummary(mockMaterial);
      assert.equal(summary.currentQuantity, 25.5);
      assert.equal(summary.minimumStockLevel, 5);
      assert.equal(summary.costPerUnit, 4000);
      assert.equal(summary.stockStatus, "IN_STOCK");
      assert.equal(summary.estimatedValue, 102000);
    });
  });

  describe("Error Middleware Behavior", () => {
    function createMockRes() {
      let statusCode = 200;
      let jsonPayload: any = null;
      return {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          jsonPayload = data;
          return this;
        },
        getStatusCode: () => statusCode,
        getJsonPayload: () => jsonPayload,
      };
    }

    test("returns 401 for UNAUTHORIZED error", () => {
      const err = new Error("Invalid token.");
      err.name = "UNAUTHORIZED";
      const req: any = {};
      const res = createMockRes();

      errorHandler(err, req, res as any, () => {});

      assert.equal(res.getStatusCode(), 401);
      assert.equal(res.getJsonPayload().success, false);
      assert.equal(res.getJsonPayload().error, "Invalid token.");
    });

    test("returns 404 for NOT_FOUND error", () => {
      const err = new Error("Customer not found.");
      err.name = "NOT_FOUND";
      const req: any = {};
      const res = createMockRes();

      errorHandler(err, req, res as any, () => {});

      assert.equal(res.getStatusCode(), 404);
      assert.equal(res.getJsonPayload().success, false);
      assert.equal(res.getJsonPayload().error, "Customer not found.");
    });

    test("returns custom status code for AppError", () => {
      const err = new AppError("Forbidden action.", 403);
      const req: any = {};
      const res = createMockRes();

      errorHandler(err, req, res as any, () => {});

      assert.equal(res.getStatusCode(), 403);
      assert.equal(res.getJsonPayload().error, "Forbidden action.");
    });

    test("handles Prisma unique constraint error P2002 as 409 Conflict", () => {
      const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.0.0",
      });
      const req: any = {};
      const res = createMockRes();

      errorHandler(err, req, res as any, () => {});

      assert.equal(res.getStatusCode(), 409);
      assert.equal(res.getJsonPayload().error, "A record with this value already exists.");
    });
  });
});
