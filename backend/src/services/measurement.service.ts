import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreateMeasurementInput,
  UpdateMeasurementInput,
} from "../validators/measurement.validator.js";

async function verifyCustomerOwnership(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    const error = new Error("Customer not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return customer;
}

export async function listMeasurements(businessId: string, customerId: string) {
  await verifyCustomerOwnership(businessId, customerId);

  return prisma.measurement.findMany({
    where: {
      businessId,
      measurementSet: { customerId, businessId },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMeasurement(
  businessId: string,
  customerId: string,
  measurementId: string,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const measurement = await prisma.measurement.findFirst({
    where: {
      id: measurementId,
      businessId,
      measurementSet: { customerId, businessId },
    },
  });

  if (!measurement) {
    const error = new Error("Measurement record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return measurement;
}

export async function createMeasurement(
  businessId: string,
  customerId: string,
  input: CreateMeasurementInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const measurementSet = await prisma.measurementSet.findFirst({
    where: { businessId, customerId, orderId: null, deletedAt: null },
  }) ?? await prisma.measurementSet.create({
    data: { businessId, customerId, version: 1 },
  });

  return prisma.measurement.create({
    data: {
      businessId,
      measurementSetId: measurementSet.id,
      unit: input.unit ?? "CM",
      neck: input.neck !== undefined ? input.neck : null,
      shoulder: input.shoulder !== undefined ? input.shoulder : null,
      chest: input.chest !== undefined ? input.chest : null,
      waist: input.waist !== undefined ? input.waist : null,
      hip: input.hip !== undefined ? input.hip : null,
      sleeve: input.sleeve !== undefined ? input.sleeve : null,
      shirtLength: input.shirtLength !== undefined ? input.shirtLength : null,
      trouserLength: input.trouserLength !== undefined ? input.trouserLength : null,
      thigh: input.thigh !== undefined ? input.thigh : null,
      knee: input.knee !== undefined ? input.knee : null,
      ankle: input.ankle !== undefined ? input.ankle : null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateMeasurement(
  businessId: string,
  customerId: string,
  measurementId: string,
  input: UpdateMeasurementInput,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const existing = await prisma.measurement.findFirst({
    where: {
      id: measurementId,
      businessId,
      measurementSet: { customerId, businessId },
    },
    select: { id: true },
  });

  if (!existing) {
    const error = new Error("Measurement record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return prisma.measurement.update({
    where: {
      id: existing.id,
    },
    data: {
      ...(input.unit !== undefined && { unit: input.unit }),
      ...(input.neck !== undefined && { neck: input.neck }),
      ...(input.shoulder !== undefined && { shoulder: input.shoulder }),
      ...(input.chest !== undefined && { chest: input.chest }),
      ...(input.waist !== undefined && { waist: input.waist }),
      ...(input.hip !== undefined && { hip: input.hip }),
      ...(input.sleeve !== undefined && { sleeve: input.sleeve }),
      ...(input.shirtLength !== undefined && { shirtLength: input.shirtLength }),
      ...(input.trouserLength !== undefined && { trouserLength: input.trouserLength }),
      ...(input.thigh !== undefined && { thigh: input.thigh }),
      ...(input.knee !== undefined && { knee: input.knee }),
      ...(input.ankle !== undefined && { ankle: input.ankle }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
    },
  });
}

export async function deleteMeasurement(
  businessId: string,
  customerId: string,
  measurementId: string,
) {
  await verifyCustomerOwnership(businessId, customerId);

  const existing = await prisma.measurement.findFirst({
    where: {
      id: measurementId,
      businessId,
      measurementSet: { customerId, businessId },
    },
    select: { id: true },
  });

  if (!existing) {
    const error = new Error("Measurement record not found.");
    error.name = "NOT_FOUND";
    throw error;
  }

  return prisma.measurement.delete({
    where: {
      id: existing.id,
    },
  });
}
