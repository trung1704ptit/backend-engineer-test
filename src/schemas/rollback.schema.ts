
export const rollbackSchema = {
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

export const getRollbackStatusSchema = {
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
};
