import { type FastifyRequest, type FastifyReply } from 'fastify';
import logger from '../logger';
import type { HealthRequest, ApiDocsRequest } from '../types/common.types';

export class SystemController {
  async getHealth(request: FastifyRequest<HealthRequest>, reply: FastifyReply) {
    try {
      logger.info('Health check requested');

      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };

      return reply.send(healthData);

    } catch (error) {
      logger.error('Health check failed', {}, error as Error);
      
      return reply.code(500).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: 'Health check failed'
      });
    }
  }

  async getApiDocs(request: FastifyRequest<ApiDocsRequest>, reply: FastifyReply) {
    try {
      logger.info('API documentation requested');

      const apiDocs = {
        name: 'Blockchain API',
        version: '1.0.0',
        endpoints: {
          blocks: {
            'POST /blocks': 'Add a new block to the blockchain',
            'GET /blocks': 'Get all blocks'
          },
          balance: {
            'GET /balance/:address': 'Get balance for a specific address',
            'GET /balance/:address/transactions': 'Get transaction history for an address'
          },
          rollback: {
            'POST /rollback?height=number': 'Rollback blockchain to a specific height',
            'GET /rollback/status': 'Get rollback status and history'
          },
          system: {
            'GET /health': 'Health check endpoint',
            'GET /api/docs': 'API documentation'
          }
        }
      };

      return reply.send(apiDocs);

    } catch (error) {
      logger.error('Failed to get API documentation', {}, error as Error);
      
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve API documentation'
      });
    }
  }
}
