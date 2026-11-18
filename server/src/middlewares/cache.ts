import { Request, Response, NextFunction } from 'express';

/**
 * Middleware thiết lập HTTP / Vercel Edge CDN Cache an toàn
 *
 * Hỗ trợ bật/tắt linh hoạt qua:
 * 1. Biến môi trường: ENABLE_CACHE=false trong file server/.env (hoặc Vercel Settings)
 * 2. Tham số query: ?no_cache=true hoặc ?refresh=true (dành cho admin/dev muốn bỏ qua cache)
 * 3. Header: x-no-cache: true
 *
 * @param seconds Thời gian lưu cache trên CDN (s-maxage tính bằng giây)
 * @param staleWhileRevalidate Thời gian cho phép phục vụ dữ liệu cũ trong lúc revalidate ngầm
 */
export function edgeCache(seconds: number = 300, staleWhileRevalidate: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Kiểm tra công tắc toàn cục trong biến môi trường
    const isCacheEnabled = process.env.ENABLE_CACHE !== 'false';

    // 2. Kiểm tra cờ bỏ qua cache trên từng request (Query hoặc Header)
    const isBypassRequested =
      req.query.no_cache === 'true' ||
      req.query.refresh === 'true' ||
      req.headers['x-no-cache'] === 'true';

    // Nếu bị tắt hoặc có yêu cầu bypass -> không cache
    if (!isCacheEnabled || isBypassRequested) {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('X-Edge-Cache', 'BYPASS_DISABLED');
      return next();
    }

    // 3. Chỉ áp dụng cho các truy vấn đọc (GET và HEAD)
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.setHeader(
        'Cache-Control',
        `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${staleWhileRevalidate}`
      );
      res.setHeader('Vary', 'Origin, Accept-Encoding');
      res.setHeader('X-Edge-Cache-TTL', `${seconds}s`);
      res.setHeader('X-Edge-Cache', 'ENABLED');
    }

    next();
  };
}

/**
 * Middleware ngăn chặn triệt để cache cho các API chứa thông tin riêng tư (Profile, Progress)
 */
export function noCache() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Edge-Cache', 'NO_STORE');
    next();
  };
}
