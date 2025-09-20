import { type FastifyRequest, type FastifyReply } from 'fastify';
import logger from '../logger';
import { RollbackService } from '../services/rollback.service';
import type { RollbackRequest, RollbackStatusRequest } from '../types/rollback.types';

export class RollbackController {
  private rollbackService = new RollbackService();

  async rollback(request: FastifyRequest<RollbackRequest>, reply: FastifyReply) {
    try {
      const { height, confirm = false } = request.query;
      
      logger.info('Rollback requested', { 
        targetHeight: height, 
        confirmed: confirm 
      });

      const rollbackInfo = await this.rollbackService.rollbackToHeight(height, confirm);

      return reply.send({
        success: true,
        message: `Successfully rolled back blockchain to height ${height}`,
        rollbackInfo
      });

    } catch (error) {
      logger.error('Rollback operation failed', { 
        targetHeight: (request.query as any)?.height 
      }, error as Error);
      
      let statusCode = 500;
      let errorMessage = 'Rollback operation failed';

      if (error instanceof Error) {
        if (error.message.includes('Cannot rollback')) {
          statusCode = 400;
          errorMessage = error.message;
        } else if (error.message.includes('requires confirmation')) {
          statusCode = 409;
          errorMessage = error.message;
        }
      }

      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
        ...(statusCode === 409 && { requiresConfirmation: true })
      });
    }
  }

  async getRollbackStatus(request: FastifyRequest<RollbackStatusRequest>, reply: FastifyReply) {
    try {
      logger.info('Retrieving rollback status');

      const status = await this.rollbackService.getRollbackStatus();

      return reply.send({
        success: true,
        ...status
      });

    } catch (error) {
      logger.error('Failed to get rollback status', {}, error as Error);
      
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve rollback status'
      });
    }
  }
}
