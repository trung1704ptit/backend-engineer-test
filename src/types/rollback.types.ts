import { type FastifyRequest } from 'fastify';

// Service types
export interface RollbackInfo {
  fromHeight: number;
  toHeight: number;
  blocksRemoved: number;
  timestamp: string;
}

export interface RollbackValidation {
  isValid: boolean;
  currentHeight: number;
  requiresConfirmation: boolean;
  message?: string;
}

export interface RollbackStatus {
  currentHeight: number;
  lastRollback: RollbackInfo | null;
  rollbackHistory: RollbackInfo[];
}

// Controller request types
export interface RollbackRequest {
  Querystring: {
    height: number;
  };
}

export interface RollbackStatusRequest {
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

export interface RollbackHistoryRequest {
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

// Response types
export interface RollbackResponse {
  success: boolean;
  message: string;
  rollbackInfo: RollbackInfo;
}

export interface RollbackStatusResponse {
  success: boolean;
  currentHeight: number;
  lastRollback: RollbackInfo | null;
  rollbackHistory: RollbackInfo[];
}

export interface RollbackValidationResponse {
  success: boolean;
  validation: RollbackValidation;
}

export interface RollbackHistoryResponse {
  success: boolean;
  rollbackHistory: RollbackInfo[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
