import { type FastifyInstance } from 'fastify';
import { RollbackController } from '../controllers';
import { rollbackSchema, getRollbackStatusSchema } from '../schemas';

export async function rollbackRoutes(fastify: FastifyInstance) {
  const rollbackController = new RollbackController();

  fastify.post('/rollback', {
    schema: rollbackSchema,
    handler: rollbackController.rollback.bind(rollbackController)
  });

  fastify.get('/rollback/status', {
    schema: getRollbackStatusSchema,
    handler: rollbackController.getRollbackStatus.bind(rollbackController)
  });
}
