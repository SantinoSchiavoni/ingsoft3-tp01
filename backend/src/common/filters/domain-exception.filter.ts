import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { DomainError } from "../errors/domain.error";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = exception.statusCode || HttpStatus.BAD_REQUEST;

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
