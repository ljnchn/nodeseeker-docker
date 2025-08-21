export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  corsOrigins: string[];
}

export const getServerConfig = (): ServerConfig => {
  return {
    port: parseInt(process.env.PORT || '3010'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3010'],
  };
};