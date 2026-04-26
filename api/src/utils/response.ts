import { Response } from 'express';

export function success(res: Response, data: unknown, statusCode = 200, meta?: object) {
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });
}

export function paginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
) {
  res.status(200).json({
    success: true,
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export function error(res: Response, message: string, statusCode = 400, details?: unknown) {
  const body: Record<string, unknown> = { success: false, error: message };
  if (details !== undefined) body.details = details;
  res.status(statusCode).json(body);
}
