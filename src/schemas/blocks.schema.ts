

export const addBlockSchema = {
  body: {
    type: 'object',
    required: ['id', 'height', 'transactions'],
    properties: {
      id: {
        type: 'string',
        description: 'Block ID (SHA256 hash of height + transaction IDs)'
      },
      height: {
        type: 'number',
        minimum: 1,
        description: 'Block height (must be exactly one higher than current height)'
      },
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'inputs', 'outputs'],
          properties: {
            id: {
              type: 'string',
              description: 'Transaction ID'
            },
            inputs: {
              type: 'array',
              items: {
                type: 'object',
                required: ['txId', 'index'],
                properties: {
                  txId: {
                    type: 'string',
                    description: 'Transaction ID being spent'
                  },
                  index: {
                    type: 'number',
                    minimum: 0,
                    description: 'Output index being spent'
                  }
                }
              }
            },
            outputs: {
              type: 'array',
              items: {
                type: 'object',
                required: ['address', 'value'],
                properties: {
                  address: {
                    type: 'string',
                    minLength: 1,
                    description: 'Recipient address'
                  },
                  value: {
                    type: 'number',
                    minimum: 0,
                    description: 'Amount to send'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        block: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            height: { type: 'number' },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  inputs: { type: 'array' },
                  outputs: { type: 'array' }
                }
              }
            }
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

export const getAllBlocksSchema = {
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
              id: { type: 'string' },
              height: { type: 'number' },
              transactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    inputs: { type: 'array' },
                    outputs: { type: 'array' }
                  }
                }
              }
            }
          }
        },
        count: { type: 'number' }
      }
    }
  }
};
