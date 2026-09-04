import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { createCustomerSchema, customerListQuerySchema, updateCustomerSchema } from "../validators/customer.validator.js";
import { createMeasurementSchema, updateMeasurementSchema } from "../validators/measurement.validator.js";
import { createOrderSchema, updateOrderSchema, orderQuerySchema } from "../validators/order.validator.js";
import { createPaymentSchema, updatePaymentSchema } from "../validators/payment.validator.js";
import { adjustStockSchema, createMaterialSchema, updateMaterialSchema, materialQuerySchema } from "../validators/inventory.validator.js";

describe("Validator Schemas Audit", () => {
  describe("Auth Validators", () => {
    test("registerSchema accepts valid input", () => {
      const result = registerSchema.parse({
        name: "Tailor John",
        email: "john@example.com",
        password: "securePassword123",
        businessName: "John Tailoring",
      });
      assert.equal(result.name, "Tailor John");
      assert.equal(result.email, "john@example.com");
      assert.equal(result.businessName, "John Tailoring");
    });

    test("registerSchema rejects short password", () => {
      assert.throws(() => {
        registerSchema.parse({
          name: "Tailor John",
          email: "john@example.com",
          password: "short",
          businessName: "John Tailoring",
        });
      });
    });

    test("loginSchema normalizes email to lowercase", () => {
      const result = loginSchema.parse({
        email: "JOHN@Example.com ",
        password: "myPassword123",
      });
      assert.equal(result.email, "john@example.com");
    });
  });

  describe("Customer Validators", () => {
    test("createCustomerSchema accepts required fields and trims strings", () => {
      const result = createCustomerSchema.parse({
        firstName: "  Jane  ",
        phone: "+2348012345678",
      });
      assert.equal(result.firstName, "Jane");
      assert.equal(result.phone, "+2348012345678");
    });

    test("customerListQuerySchema applies default pagination values", () => {
      const result = customerListQuerySchema.parse({});
      assert.equal(result.page, 1);
      assert.equal(result.limit, 20);
    });
  });

  describe("Measurement Validators", () => {
    test("createMeasurementSchema defaults unit to CM", () => {
      const result = createMeasurementSchema.parse({
        chest: 40.5,
        waist: 34,
      });
      assert.equal(result.unit, "CM");
      assert.equal(result.chest, 40.5);
    });

    test("createMeasurementSchema accepts INCH unit and numeric fields", () => {
      const result = createMeasurementSchema.parse({
        unit: "INCH",
        shoulder: 18.5,
        sleeve: 25,
      });
      assert.equal(result.unit, "INCH");
      assert.equal(result.shoulder, 18.5);
    });
  });

  describe("Order Validators", () => {
    test("createOrderSchema validates positive totalAmount and defaults status", () => {
      const result = createOrderSchema.parse({
        garmentType: "Senator Suit",
        totalAmount: 25000,
        depositAmount: 10000,
      });
      assert.equal(result.garmentType, "Senator Suit");
      assert.equal(result.totalAmount, 25000);
      assert.equal(result.depositAmount, 10000);
      assert.equal(result.priority, "MEDIUM");
    });

    test("createOrderSchema rejects negative totalAmount", () => {
      assert.throws(() => {
        createOrderSchema.parse({
          garmentType: "Shirt",
          totalAmount: -500,
        });
      });
    });
  });

  describe("Payment Validators", () => {
    test("createPaymentSchema accepts positive amount and valid payment method", () => {
      const result = createPaymentSchema.parse({
        amount: 5000,
        method: "BANK_TRANSFER",
        reference: "TXN12345",
      });
      assert.equal(result.amount, 5000);
      assert.equal(result.method, "BANK_TRANSFER");
    });

    test("createPaymentSchema rejects zero or negative payment amount", () => {
      assert.throws(() => {
        createPaymentSchema.parse({
          amount: 0,
          method: "CASH",
        });
      });
    });
  });

  describe("Inventory Validators", () => {
    test("createMaterialSchema accepts valid material input", () => {
      const result = createMaterialSchema.parse({
        name: "Italian Wool Fabric",
        category: "FABRIC",
        unit: "YARD",
        initialQuantity: 50,
        minimumStockLevel: 10,
        costPerUnit: 1500,
      });
      assert.equal(result.name, "Italian Wool Fabric");
      assert.equal(result.category, "FABRIC");
      assert.equal(result.unit, "YARD");
      assert.equal(result.initialQuantity, 50);
    });

    test("adjustStockSchema rejects zero quantityChange", () => {
      assert.throws(() => {
        adjustStockSchema.parse({
          type: "USAGE",
          quantityChange: 0,
        });
      });
    });
  });
});
