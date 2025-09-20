import { type FastifyInstance } from 'fastify';
import { RollbackController } from '../controllers';

// Schema for POST /rollback request validation
const rollbackSchema = {
  querystring: {
    type: 'object',
    required: ['height'],
    properties: {
      height: {
        type: 'number',
        minimum: 0,
        description: 'Block height to rollback to'
      },
      confirm: {
        type: 'boolean',
        default: false,
        description: 'Confirmation flag for rollback operation'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        rollbackInfo: {
          type: 'object',
          properties: {
            fromHeight: { type: 'number' },
            toHeight: { type: 'number' },
            blocksRemoved: { type: 'number' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    409: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        requiresConfirmation: { type: 'boolean' }
      }
    }
  }
};

export async function rollbackRoutes(fastify: FastifyInstance) {
  const rollbackController = new RollbackController();

  // POST /rollback?height=number - Rollback blockchain to a specific height
  fastify.post('/rollback', {
    schema: rollbackSchema,
    handler: rollbackController.rollback.bind(rollbackController)
  });

  // GET /rollback/status - Get rollback status and history (optional)
  fastify.get('/rollback/status', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            currentHeight: { type: 'number' },
            lastRollback: {
              type: 'object',
              nullable: true,
              properties: {
                timestamp: { type: 'string' },
                fromHeight: { type: 'number' },
                toHeight: { type: 'number' },
                blocksRemoved: { type: 'number' }
              }
            },
            rollbackHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  fromHeight: { type: 'number' },
                  toHeight: { type: 'number' },
                  blocksRemoved: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    handler: rollbackController.getRollbackStatus.bind(rollbackController)
  });
}
