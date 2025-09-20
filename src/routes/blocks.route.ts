import { type FastifyInstance } from 'fastify';
import { BlocksController } from '../controllers';
import { addBlockSchema, getAllBlocksSchema } from '../schemas';

export async function blocksRoutes(fastify: FastifyInstance) {
  const blocksController = new BlocksController();

  fastify.post('/blocks', {
    schema: addBlockSchema,
    handler: blocksController.addBlock.bind(blocksController)
  });

  fastify.get('/blocks', {
    schema: getAllBlocksSchema,
    handler: blocksController.getAllBlocks.bind(blocksController)
  });
}
