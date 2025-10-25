export class ErrorResponse extends Error {
  public readonly statusCode: number;
  public readonly body: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.body = JSON.stringify({ error: message });
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toResponse() {
    return {
      statusCode: this.statusCode,
      body: this.body,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
}

export class BadRequestError extends ErrorResponse {
  constructor(message: string = 'Bad Request') {
    super(400, message);
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message: string = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends ErrorResponse {
  constructor(message: string = 'Conflict') {
    super(409, message);
  }
}

export class UnprocessableEntityError extends ErrorResponse {
  constructor(message: string = 'Unprocessable Entity') {
    super(422, message);
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(message: string = 'Internal Server Error') {
    super(500, message);
  }
}

export class ServiceUnavailableError extends ErrorResponse {
  constructor(message: string = 'Service Unavailable') {
    super(503, message);
  }
}

