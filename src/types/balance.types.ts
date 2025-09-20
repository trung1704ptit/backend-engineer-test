import { type FastifyRequest } from 'fastify';

// Service types
export interface Transaction {
  txId: string;
  blockHeight: number;
  timestamp: string;
  amount: number;
  type: 'input' | 'output';
  address: string;
}

export interface BalanceInfo {
  address: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

// Controller request types
export interface GetBalanceRequest {
  Params: {
    address: string;
  };
}

export interface GetTransactionsRequest {
  Params: {
    address: string;
  };
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

// Response types
export interface BalanceResponse {
  success: boolean;
  address: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface TransactionHistoryResponse {
  success: boolean;
  address: string;
  transactions: Transaction[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
