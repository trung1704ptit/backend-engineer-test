import { type FastifyRequest } from 'fastify';

// Service types
export interface Output {
  address: string;
  value: number;
}

export interface Input {
  txId: string;
  index: number;
}

export interface Transaction {
  id: string;
  inputs: Array<Input>;
  outputs: Array<Output>;
}

export interface Block {
  id: string;
  height: number;
  transactions: Array<Transaction>;
}

// Controller request types
export interface AddBlockRequest {
  Body: Block;
}

export interface GetBlocksRequest {
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

export interface GetBlockByHeightRequest {
  Params: {
    height: number;
  };
}

// Response types
export interface AddBlockResponse {
  success: boolean;
  block: Block;
  message: string;
}

export interface GetBlocksResponse {
  success: boolean;
  blocks: Block[];
  count: number;
}

export interface GetBlockResponse {
  success: boolean;
  block: Block | null;
}
