import { test, describe } from "node:test";
import assert from "node:assert/strict";

import prisma from "../lib/prisma.js";
import { getCustomer, updateCustomer, deleteCustomer } from "../services/customer.service.js";
import { getMeasurement, updateMeasurement, deleteMeasurement } from "../services/measurement.service.js";
import { getOrder, updateOrder, deleteOrder } from "../services/order.service.js";
import { getPayment, updatePayment, deletePayment } from "../services/payment.service.js";
import { getMaterial, updateMaterial, deleteMaterial } from "../services/inventory.service.js";

describe("Multi-Tenant Business Isolation Security Audit", () => {
  const businessA = "biz-aaaa-1111-2222-333344445555";
  const businessB = "biz-bbbb-1111-2222-333344445555";

  const customerIdOfBusinessB = "cust-bbbb-9999-8888-777766665555";
  const measurementIdOfBusinessB = "meas-bbbb-9999-8888-777766665555";
  const orderIdOfBusinessB = "ord-bbbb-9999-8888-777766665555";
  const paymentIdOfBusinessB = "pay-bbbb-9999-8888-777766665555";
  const materialIdOfBusinessB = "mat-bbbb-9999-8888-777766665555";

  test("Customer Isolation: Queries always include businessId filter", async () => {
    let capturedWhere: any = null;
    (prisma.customer.findFirst as any) = async (args: any) => {
      capturedWhere = args.where;
      if (args.where.businessId === businessA) {
        return null;
      }
      return { id: customerIdOfBusinessB, businessId: businessB };
    };

    const customer = await getCustomer(businessA, customerIdOfBusinessB);
    assert.equal(customer, null);
    assert.equal(capturedWhere.id, customerIdOfBusinessB);
    assert.equal(capturedWhere.businessId, businessA);

    const updated = await updateCustomer(businessA, customerIdOfBusinessB, { firstName: "Hacked" });
    assert.equal(updated, null);

    const deleted = await deleteCustomer(businessA, customerIdOfBusinessB);
    assert.equal(deleted, null);
  });

  test("Measurement Isolation: Rejects access when Customer does not belong to business", async () => {
    (prisma.customer.findFirst as any) = async (args: any) => {
      return null;
    };

    await assert.rejects(
      async () => {
        await getMeasurement(businessA, customerIdOfBusinessB, measurementIdOfBusinessB);
      },
      (err: any) => err.name === "NOT_FOUND" && err.message === "Customer not found.",
    );
  });

  test("Order Isolation: Rejects access when Customer does not belong to business", async () => {
    (prisma.customer.findFirst as any) = async (args: any) => {
      return null;
    };

    await assert.rejects(
      async () => {
        await getOrder(businessA, customerIdOfBusinessB, orderIdOfBusinessB);
      },
      (err: any) => err.name === "NOT_FOUND" && err.message === "Customer not found.",
    );
  });

  test("Payment Isolation: Rejects access when Customer/Order does not belong to business", async () => {
    (prisma.customer.findFirst as any) = async (args: any) => {
      return null;
    };

    await assert.rejects(
      async () => {
        await getPayment(businessA, customerIdOfBusinessB, orderIdOfBusinessB, paymentIdOfBusinessB);
      },
      (err: any) => err.name === "NOT_FOUND" && err.message === "Customer not found.",
    );
  });

  test("Material Isolation: Queries always include businessId filter", async () => {
    let capturedWhere: any = null;
    (prisma.material.findFirst as any) = async (args: any) => {
      capturedWhere = args.where;
      if (args.where.businessId === businessA) {
        return null;
      }
      return { id: materialIdOfBusinessB, businessId: businessB };
    };

    await assert.rejects(
      async () => {
        await getMaterial(businessA, materialIdOfBusinessB);
      },
      (err: any) => err.name === "NOT_FOUND",
    );
    assert.equal(capturedWhere.id, materialIdOfBusinessB);
    assert.equal(capturedWhere.businessId, businessA);
  });
});
