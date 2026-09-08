import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, test } from "node:test";
import request from "supertest";

import app from "../app.js";
import prisma from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";

const businessIds: string[] = [];

describe("real database stock race", () => {
  let businessId: string;
  let materialId: string;
  let token: string;
  let orderMaterialIds: string[];

  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    const business = await prisma.business.create({ data: { name: "Concurrency tenant" } });
    businessId = business.id;
    businessIds.push(businessId);
    const user = await prisma.user.create({
      data: {
        businessId,
        name: "Concurrency owner",
        email: `${randomUUID()}@example.test`,
        passwordHash: "not-used-by-this-test",
      },
    });
    token = signAccessToken({ userId: user.id, email: user.email, businessId, role: user.role });
    const customer = await prisma.customer.create({
      data: {
        businessId,
        firstName: "Concurrency customer",
        phone: `+234${randomUUID().replaceAll("-", "").slice(0, 10)}`,
      },
    });
    const material = await prisma.material.create({
      data: {
        businessId,
        code: `FAB-${randomUUID()}`,
        name: "One unit fabric",
        category: "FABRIC",
        unit: "YARD",
        currentQuantity: 1,
        costPerUnit: 10,
      },
    });
    materialId = material.id;
    orderMaterialIds = [];
    for (let index = 0; index < 5; index += 1) {
      const order = await prisma.order.create({
        data: { businessId, customerId: customer.id, garmentType: `Order ${index}`, totalAmount: 100 },
      });
      const orderMaterial = await prisma.orderMaterial.create({
        data: {
          businessId,
          orderId: order.id,
          materialId,
          plannedQuantity: 1,
          unit: "YARD",
          unitCost: 10,
        },
      });
      orderMaterialIds.push(orderMaterial.id);
    }
  });

  afterEach(async () => {
    await prisma.orderMaterial.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: businessIds.splice(0) } } });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test("allows exactly one concurrent reservation and never goes negative", async () => {
    const responses = await Promise.all(orderMaterialIds.map(async (orderMaterialId) => {
      const { orderId } = await prisma.orderMaterial.findUniqueOrThrow({
        where: { id: orderMaterialId },
        select: { orderId: true },
      });
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { customerId: true },
      });
      return request(app)
        .post(`/api/customers/${order.customerId}/orders/${orderId}/materials/${orderMaterialId}/consume`)
        .set("Authorization", `Bearer ${token}`)
        .send({ actualQuantity: 1 });
    }));

    assert.equal(responses.filter((response) => response.status === 200).length, 1);
    assert.equal(
      responses.filter((response) => response.status === 400 && response.body.code === "INSUFFICIENT_STOCK").length,
      4,
    );

    const material = await prisma.material.findUniqueOrThrow({ where: { id: materialId } });
    assert.equal(Number(material.currentQuantity), 0);
    assert.ok(Number(material.currentQuantity) >= 0);
  });
});
