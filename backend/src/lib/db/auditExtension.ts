import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getRequestContext } from "../requestContext.js";

const auditedModels = new Set(["Order", "Payment", "Customer"]);
const auditStateSchema = z.record(z.string(), z.unknown());
export type AuditState = z.infer<typeof auditStateSchema>;

function serializeState(value: unknown): AuditState | null {
  if (value === null || value === undefined) return null;
  return auditStateSchema.parse(JSON.parse(JSON.stringify(value)));
}

type TransactionDelegate = {
  [operation: string]: (args: Record<string, unknown>) => Promise<unknown>;
};

type TransactionClientLike = {
  $transaction<T>(callback: (tx: TransactionClientLike) => Promise<T>): Promise<T>;
  [model: string]: unknown;
};

export function createAuditExtension(baseClient: PrismaClient) {
  const client = baseClient as unknown as TransactionClientLike;

  return Prisma.defineExtension({
    name: "immutable-audit-ledger",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!auditedModels.has(model) || !["create", "update", "delete"].includes(operation)) {
            return query(args);
          }

          const context = getRequestContext();
          if (!context) {
            return query(args);
          }
          if (!context.tenantId || !context.userId) {
            throw new Error("A validated request context is required for audited mutations.");
          }

          return client.$transaction(async (tx) => {
            const delegateName = `${model.slice(0, 1).toLowerCase()}${model.slice(1)}`;
            const delegate = tx[delegateName] as TransactionDelegate;
            const typedArgs = args as Record<string, unknown>;
            let previousState: AuditState | null = null;

            if (operation !== "create") {
              const where = typedArgs.where as Record<string, unknown> | undefined;
              if (where) {
                previousState = serializeState(await delegate.findUnique({ where }));
              }
            }

            const result = await delegate[operation](typedArgs);
            const newState = operation === "delete" ? null : serializeState(result);
            const entity = (result ?? previousState) as AuditState | null;
            const entityId = String(entity?.id ?? (typedArgs.where as { id?: string } | undefined)?.id ?? "");

            if (!entityId) {
              throw new Error(`Unable to determine audited ${model} entity id.`);
            }

            const auditLog = tx.auditLog as TransactionDelegate;
            await auditLog.create({
              data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: operation.toUpperCase() as "CREATE" | "UPDATE" | "DELETE",
                entityName: model,
                entityId,
                previousState: previousState as Prisma.InputJsonValue | undefined,
                newState: newState as Prisma.InputJsonValue | undefined,
                ipAddress: context.ipAddress,
              },
            });

            return result;
          });
        },
      },
    },
  });
}