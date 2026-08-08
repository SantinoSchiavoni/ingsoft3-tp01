import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
}

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("health")
  async check(): Promise<HealthResponse> {
    let dbStatus = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    return {
      status: dbStatus === "ok" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }

  @Get("api/health")
  async checkApi(): Promise<HealthResponse> {
    return this.check();
  }
}
