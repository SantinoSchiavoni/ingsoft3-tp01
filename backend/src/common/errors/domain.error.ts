export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class EntityNotFoundError extends DomainError {
  readonly code = "ENTITY_NOT_FOUND";
  readonly statusCode = 404;

  constructor(entityName: string, id: number | string) {
    super(`${entityName} with ID ${id} was not found`);
  }
}

export class InvalidOperationError extends DomainError {
  readonly code = "INVALID_OPERATION";
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleValidationError extends DomainError {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
