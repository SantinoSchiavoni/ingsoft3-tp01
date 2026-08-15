export interface EnvConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  corsOrigin: string;
}

export const envConfig = (): EnvConfig => ({
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://orderflow:orderflow@localhost:5432/orderflow?schema=public",
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:41777',
});
