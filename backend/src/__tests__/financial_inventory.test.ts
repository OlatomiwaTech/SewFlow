import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";

import { formatOrderSummary } from "../services/order.service.js";
import { getStockStatus, formatMaterialSummary } from "../services/inventory.service.js";

describe("Financial & Inventory Edge Cases Audit", () => {
  describe("Financial Precision & Order Calculations", () => {
    const dummyCustomer = {
      id: "cust-1",
      businessId: "biz-1",
      firstName: "Alice",
      lastName: "Smith",
      phone: "+2348011111111",
      email: null,
      address: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("handles multiple payments with decimal fractions without JS floating point artifacts", () => {
      const mockOrder: any = {
        id: "ord-1",
        customerId: "cust-1",
        garmentType: "Dress",
        description: null,
        quantity: 1,
        totalAmount: new Prisma.Decimal(19999.99),
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
        payments: [
          { id: "p1", amount: new Prisma.Decimal(3333.33) },
          { id: "p2", amount: new Prisma.Decimal(3333.33) },
          { id: "p3", amount: new Prisma.Decimal(3333.33) },
        ],
        history: [],
      };

      const summary = formatOrderSummary(mockOrder);
      assert.equal(summary.totalPaid, 9999.99);
      assert.equal(summary.balanceDue, 10000);
      assert.equal(summary.paymentStatus, "PARTIALLY_PAID");
    });

    test("preserves deposit fallback for legacy orders with depositAmount > 0 and no payment array", () => {
      const legacyOrder: any = {
        id: "ord-legacy",
        customerId: "cust-1",
        garmentType: "Traditional Attire",
        totalAmount: new Prisma.Decimal(50000),
        depositAmount: new Prisma.Decimal(20000),
        status: "SEWING",
        priority: "MEDIUM",
        customer: dummyCustomer,
        payments: undefined, // no payments array loaded
      };

      const summary = formatOrderSummary(legacyOrder);
      assert.equal(summary.totalPaid, 20000);
      assert.equal(summary.balanceDue, 30000);
      assert.equal(summary.paymentStatus, "PARTIALLY_PAID");
    });
  });

  describe("Inventory Valuation & Negative Stock Guard", () => {
    test("calculates correct valuation for fractional material quantities", () => {
      const mockMaterial: any = {
        id: "mat-wool",
        businessId: "biz-1",
        name: "Linen",
        category: "FABRIC",
        unit: "METER",
        currentQuantity: new Prisma.Decimal(12.75),
        minimumStockLevel: new Prisma.Decimal(2.5),
        costPerUnit: new Prisma.Decimal(3500.50),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        stockMovements: [],
      };

      const summary = formatMaterialSummary(mockMaterial);
      assert.equal(summary.currentQuantity, 12.75);
      assert.equal(summary.minimumStockLevel, 2.5);
      assert.equal(summary.costPerUnit, 3500.50);
      assert.equal(summary.stockStatus, "IN_STOCK");
      assert.equal(summary.estimatedValue, 44631.38);
    });

    test("correctly flags LOW_STOCK when stock equals minimumStockLevel", () => {
      assert.equal(getStockStatus(5.0, 5.0), "LOW_STOCK");
      assert.equal(getStockStatus(4.99, 5.0), "LOW_STOCK");
      assert.equal(getStockStatus(5.01, 5.0), "IN_STOCK");
      assert.equal(getStockStatus(0, 5.0), "OUT_OF_STOCK");
    });
  });
});
