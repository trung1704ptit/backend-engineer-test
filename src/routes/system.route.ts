import { type FastifyInstance } from 'fastify';
import { SystemController } from '../controllers';
import { getHealthSchema, getApiDocsSchema } from '../schemas';

export async function systemRoutes(fastify: FastifyInstance) {
  const systemController = new SystemController();

  fastify.get('/api/health', {
    schema: getHealthSchema,
    handler: systemController.getHealth.bind(systemController)
  });

  fastify.get('/api/docs', {
    schema: getApiDocsSchema,
    handler: systemController.getApiDocs.bind(systemController)
  });
}
