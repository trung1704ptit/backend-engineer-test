import { type FastifyRequest } from 'fastify';

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
}

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

// System controller types
export interface HealthRequest {
  Querystring: {
    detailed?: boolean;
  };
}

export interface ApiDocsRequest {
  Querystring: {
    format?: 'json' | 'yaml';
  };
}

// Response types
export interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services?: {
    database: 'connected' | 'disconnected';
    blockchain: 'operational' | 'maintenance';
  };
}

export interface ApiDocsResponse {
  success: boolean;
  documentation: any;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Generic response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}
