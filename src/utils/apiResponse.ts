import { Response } from 'express';

export const sendSuccess = (res: Response, data: any = null, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 500, details: any = null) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details,
  });
};
