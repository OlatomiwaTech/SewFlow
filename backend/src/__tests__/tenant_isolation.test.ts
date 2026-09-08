import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, test } from "node:test";
import request from "supertest";

import app from "../app.js";
import prisma from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";

const createdBusinessIds: string[] = [];

async function createTenant(name: string) {
  const business = await prisma.business.create({ data: { name } });
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      name: `${name} owner`,
      email: `${randomUUID()}@example.test`,
      passwordHash: "not-used-by-this-test",
    },
  });
  createdBusinessIds.push(business.id);
  return {
    business,
    token: signAccessToken({
      userId: user.id,
      email: user.email,
      businessId: business.id,
      role: user.role,
    }),
  };
}

describe("HTTP tenant isolation", () => {
  let tenantA: Awaited<ReturnType<typeof createTenant>>;
  let tenantB: Awaited<ReturnType<typeof createTenant>>;
  let customerB: { id: string };
  let orderB: { id: string };
  let paymentB: { id: string };
  let orderMaterialB: { id: string };

  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    tenantA = await createTenant("Tenant A");
    tenantB = await createTenant("Tenant B");
    await prisma.customer.create({
      data: {
        businessId: tenantA.business.id,
        firstName: "A customer",
        phone: `+234${randomUUID().replaceAll("-", "").slice(0, 10)}`,
      },
    });
    customerB = await prisma.customer.create({
      data: {
        businessId: tenantB.business.id,
        firstName: "B customer",
        phone: `+234${randomUUID().replaceAll("-", "").slice(0, 10)}`,
      },
      select: { id: true },
    });
    orderB = await prisma.order.create({
      data: {
        businessId: tenantB.business.id,
        customerId: customerB.id,
        garmentType: "Tenant B suit",
        totalAmount: 100,
      },
      select: { id: true },
    });
    const materialB = await prisma.material.create({
      data: {
        businessId: tenantB.business.id,
        code: `FAB-${randomUUID()}`,
        name: "Tenant B fabric",
        category: "FABRIC",
        unit: "YARD",
        costPerUnit: 10,
      },
    });
    orderMaterialB = await prisma.orderMaterial.create({
      data: {
        businessId: tenantB.business.id,
        orderId: orderB.id,
        materialId: materialB.id,
        plannedQuantity: 1,
        unit: "YARD",
        unitCost: 10,
      },
      select: { id: true },
    });
    paymentB = await prisma.payment.create({
      data: {
        businessId: tenantB.business.id,
        orderId: orderB.id,
        amount: 10,
        method: "CASH",
      },
      select: { id: true },
    });
  });

  afterEach(async () => {
    if (createdBusinessIds.length > 0) {
      await prisma.orderMaterial.deleteMany({ where: { businessId: { in: createdBusinessIds } } });
      await prisma.business.deleteMany({ where: { id: { in: createdBusinessIds.splice(0) } } });
    }
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test("rejects cross-tenant resource access for every supported mutation", async () => {
    const paths = [
      ["get", `/api/customers/${customerB.id}/orders/${orderB.id}`],
      ["put", `/api/customers/${customerB.id}/orders/${orderB.id}`],
      ["patch", `/api/customers/${customerB.id}/orders/${orderB.id}`],
      ["delete", `/api/customers/${customerB.id}/orders/${orderB.id}`],
    ] as const;

    for (const [method, path] of paths) {
      const response = await request(app)[method](path)
        .set("Authorization", `Bearer ${tenantA.token}`)
        .send({ garmentType: "tampered", totalAmount: 1 });
      assert.ok([403, 404].includes(response.status), `${method.toUpperCase()} returned ${response.status}`);
    }
  });

  test("does not return another tenant's customers, even with a spoofed query tenant", async () => {
    const response = await request(app)
      .get(`/api/customers?businessId=${tenantB.business.id}`)
      .set("Authorization", `Bearer ${tenantA.token}`);

    assert.equal(response.status, 200);
    assert.ok(response.body.data.every((customer: { businessId: string }) => customer.businessId === tenantA.business.id));
    assert.equal(response.body.data.some((customer: { id: string }) => customer.id === customerB.id), false);
  });

  test("ignores a spoofed businessId in a customer payload", async () => {
    const response = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${tenantA.token}`)
      .send({
        businessId: tenantB.business.id,
        firstName: "Created in A",
        phone: `+234${randomUUID().replaceAll("-", "").slice(0, 10)}`,
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.businessId, tenantA.business.id);
    assert.equal(await prisma.customer.count({ where: { id: response.body.data.id, businessId: tenantB.business.id } }), 0);
  });

  test("rejects cross-tenant payment and order-material access", async () => {
    const paymentResponse = await request(app)
      .get(`/api/customers/${customerB.id}/orders/${orderB.id}/payments/${paymentB.id}`)
      .set("Authorization", `Bearer ${tenantA.token}`);
    const materialResponse = await request(app)
      .patch(`/api/customers/${customerB.id}/orders/${orderB.id}/materials/${orderMaterialB.id}`)
      .set("Authorization", `Bearer ${tenantA.token}`);

    assert.equal(paymentResponse.status, 404);
    assert.equal(materialResponse.status, 404);
  });
});