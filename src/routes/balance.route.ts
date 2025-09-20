import { type FastifyInstance } from 'fastify';
import { BalanceController } from '../controllers';

// Schema for GET /balance/:address request validation
const getBalanceSchema = {
  params: {
    type: 'object',
    required: ['address'],
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        description: 'Blockchain address to check balance for'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        address: { type: 'string' },
        balance: { type: 'number' },
        currency: { type: 'string' },
        lastUpdated: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

export async function balanceRoutes(fastify: FastifyInstance) {
  const balanceController = new BalanceController();

  // GET /balance/:address - Get balance for a specific address
  fastify.get('/balance/:address', {
    schema: getBalanceSchema,
    handler: balanceController.getBalance.bind(balanceController)
  });

  // GET /balance/:address/transactions - Get transaction history for an address (optional)
  fastify.get('/balance/:address/transactions', {
    schema: {
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: {
            type: 'string',
            minLength: 1
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            address: { type: 'string' },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  txId: { type: 'string' },
                  blockHeight: { type: 'number' },
                  timestamp: { type: 'string' },
                  amount: { type: 'number' },
                  type: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'number' },
                offset: { type: 'number' },
                total: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: balanceController.getTransactionHistory.bind(balanceController)
  });
}
