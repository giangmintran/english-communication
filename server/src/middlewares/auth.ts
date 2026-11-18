import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, getScopedSupabaseClient } from '../config/supabase';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
  supabase?: SupabaseClient;
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Authorization header missing or invalid format (Bearer token required)',
      401,
      'UNAUTHORIZED'
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return sendError(
        res,
        'Invalid or expired token',
        401,
        'UNAUTHORIZED',
        error?.message
      );
    }

    req.user = user;
    req.token = token;
    req.supabase = getScopedSupabaseClient(token);
    next();
  } catch (err: any) {
    return sendError(res, 'Authentication error', 500, 'AUTH_ERROR', err.message);
  }
};
