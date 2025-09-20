
export const getBalanceSchema = {
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

export const getTransactionHistorySchema = {
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
};
