import { type FastifyInstance } from 'fastify';
import { blocksRoutes } from './blocks.route';
import { balanceRoutes } from './balance.route';
import { rollbackRoutes } from './rollback.route';
import { systemRoutes } from './system.route';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(blocksRoutes);
  await fastify.register(balanceRoutes);
  await fastify.register(rollbackRoutes);
  await fastify.register(systemRoutes);
}
