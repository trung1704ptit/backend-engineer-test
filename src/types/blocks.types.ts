import { type FastifyRequest } from 'fastify';

// Service types
export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  data: any;
  nonce: number;
}

// Controller request types
export interface AddBlockRequest {
  Body: {
    data: any;
    previousHash: string;
    timestamp?: number;
    nonce?: number;
  };
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
