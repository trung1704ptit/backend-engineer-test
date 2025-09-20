import { type FastifyInstance } from 'fastify';
import { BlocksController } from '../controllers';

// Schema for POST /blocks request validation
const addBlockSchema = {
  body: {
    type: 'object',
    required: ['data', 'previousHash'],
    properties: {
      data: {
        type: 'object',
        description: 'Block data (transactions, etc.)'
      },
      previousHash: {
        type: 'string',
        description: 'Hash of the previous block'
      },
      timestamp: {
        type: 'number',
        description: 'Block timestamp (optional, defaults to current time)'
      },
      nonce: {
        type: 'number',
        description: 'Proof of work nonce (optional)'
      }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        block: {
          type: 'object',
          properties: {
            index: { type: 'number' },
            hash: { type: 'string' },
            previousHash: { type: 'string' },
            timestamp: { type: 'number' },
            data: { type: 'object' },
            nonce: { type: 'number' }
          }
        },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

export async function blocksRoutes(fastify: FastifyInstance) {
  const blocksController = new BlocksController();

  // POST /blocks - Add a new block to the blockchain
  fastify.post('/blocks', {
    schema: addBlockSchema,
    handler: blocksController.addBlock.bind(blocksController)
  });

  // GET /blocks - Get all blocks (optional endpoint)
  fastify.get('/blocks', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  hash: { type: 'string' },
                  previousHash: { type: 'string' },
                  timestamp: { type: 'number' },
                  data: { type: 'object' },
                  nonce: { type: 'number' }
                }
              }
            },
            count: { type: 'number' }
          }
        }
      }
    },
    handler: blocksController.getAllBlocks.bind(blocksController)
  });
}
