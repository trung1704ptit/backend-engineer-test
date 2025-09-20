import { type FastifyInstance } from 'fastify';
import { BalanceController } from '../controllers';
import { getBalanceSchema, getTransactionHistorySchema } from '../schemas';

export async function balanceRoutes(fastify: FastifyInstance) {
  const balanceController = new BalanceController();

  fastify.get('/balance/:address', {
    schema: getBalanceSchema,
    handler: balanceController.getBalance.bind(balanceController)
  });

  fastify.get('/balance/:address/transactions', {
    schema: getTransactionHistorySchema,
    handler: balanceController.getTransactionHistory.bind(balanceController)
  });
}
