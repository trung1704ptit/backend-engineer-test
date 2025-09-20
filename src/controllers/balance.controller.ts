import { type FastifyRequest, type FastifyReply } from 'fastify';
import logger from '../logger';
import { BalanceService } from '../services/balance.service';
import type { GetBalanceRequest, GetTransactionsRequest } from '../types/balance.types';

export class BalanceController {
  private balanceService = new BalanceService();

  async getBalance(request: FastifyRequest<GetBalanceRequest>, reply: FastifyReply) {
    try {
      const { address } = request.params;
      
      logger.info('Checking balance for address', { address });

      const balanceInfo = await this.balanceService.getBalance(address);

      return reply.send({
        success: true,
        ...balanceInfo
      });

    } catch (error) {
      logger.error('Failed to get balance', { 
        address: (request.params as any)?.address 
      }, error as Error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = errorMessage.includes('Invalid address') ? 400 : 500;
      
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage
      });
    }
  }

  async getTransactionHistory(request: FastifyRequest<GetTransactionsRequest>, reply: FastifyReply) {
    try {
      const { address } = request.params;
      const { limit = 10, offset = 0 } = request.query;
      
      logger.info('Retrieving transaction history', { 
        address, 
        limit, 
        offset 
      });

      const transactions = await this.balanceService.getTransactionHistory(
        address, 
        limit, 
        offset
      );

      return reply.send({
        success: true,
        address,
        transactions,
        pagination: {
          limit,
          offset,
          total: transactions.length
        }
      });

    } catch (error) {
      logger.error('Failed to get transaction history', { 
        address: (request.params as any)?.address 
      }, error as Error);
      
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve transaction history'
      });
    }
  }
}
