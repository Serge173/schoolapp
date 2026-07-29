/** Diagnostic Edge — toujours déployé avec le build statique (bypass fonctions serverless figées). */
export const config = {
  matcher: ['/api/ping', '/api/health'],
};

export default function middleware(request) {
  const path = new URL(request.url).pathname;

  if (path === '/api/ping' || path.endsWith('/api/ping')) {
    return Response.json({
      v: 'jwt-fix-5',
      edge: true,
      vercel: true,
      hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasJwtSecret: Boolean((process.env.JWT_SECRET || '').trim()),
      nodeEnv: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
    });
  }

  if (path === '/api/health' || path.endsWith('/api/health')) {
    const jwtReady =
      Boolean((process.env.JWT_SECRET || '').trim()) ||
      Boolean(
        process.env.DATABASE_URL ||
          process.env.POSTGRES_URL ||
          process.env.POSTGRES_PRISMA_URL
      );
    return Response.json({
      ok: true,
      jwt: jwtReady,
      edge: true,
      env: process.env.NODE_ENV || process.env.VERCEL_ENV || null,
      vercel: true,
      db: jwtReady && !(process.env.JWT_SECRET || '').trim(),
    });
  }
}
