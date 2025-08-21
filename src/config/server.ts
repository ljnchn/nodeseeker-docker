export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  corsOrigins: string[];
  jwtSecret: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const getServerConfig = (): ServerConfig => {
  return {
    port: parseInt(process.env.PORT || '3010'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3010'],
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MAX || '200'), // 200 requests per minute
    }
  };
};