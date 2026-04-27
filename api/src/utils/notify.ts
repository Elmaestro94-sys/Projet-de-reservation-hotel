import { NotificationType } from '@prisma/client';
import prisma from './prisma';

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: object,
): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, type, title, body, data } });
  } catch {
    // notification failure must never block the main flow
  }
}
