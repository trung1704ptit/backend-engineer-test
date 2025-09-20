
export const getHealthSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' }
      }
    }
  }
};

export const getApiDocsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        endpoints: { type: 'object' }
      }
    }
  }
};
