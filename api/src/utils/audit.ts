import prisma from './prisma';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';

export async function logAudit(params: {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  req?: Request;
  reason?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
        ipAddress: params.req?.ip,
        userAgent: params.req?.get('user-agent'),
        reason: params.reason,
      },
    });
  } catch {
    // audit failures must not break main flows
  }
}
