import { type FastifyInstance } from 'fastify';
import { SystemController } from '../controllers';

export async function systemRoutes(fastify: FastifyInstance) {
  const systemController = new SystemController();

  // Health check endpoint
  fastify.get('/api/health', {
    schema: {
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
    },
    handler: systemController.getHealth.bind(systemController)
  });

  // API documentation endpoint
  fastify.get('/api/docs', {
    schema: {
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
    },
    handler: systemController.getApiDocs.bind(systemController)
  });
}
