import { type FastifyRequest, type FastifyReply } from 'fastify';
import logger from '../logger';
import { BlocksService } from '../services/blocks.service';
import type { AddBlockRequest, GetBlocksRequest } from '../types/blocks.types';

export class BlocksController {
  private blocksService = new BlocksService();

  async addBlock(request: FastifyRequest<AddBlockRequest>, reply: FastifyReply) {
    try {
      const block = request.body;
      
      logger.info('Adding new block', { 
        blockId: block.id,
        height: block.height,
        transactionCount: block.transactions.length
      });

      const newBlock = await this.blocksService.addBlock(block);

      return reply.code(201).send({
        success: true,
        block: newBlock,
        message: 'Block added successfully'
      });

    } catch (error) {
      logger.error('Failed to add block', {}, error as Error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add block to blockchain';
      const statusCode = errorMessage.includes('Invalid') ? 400 : 500;
      
      return reply.code(statusCode).send({
        success: false,
        error: errorMessage
      });
    }
  }

  async getAllBlocks(request: FastifyRequest<GetBlocksRequest>, reply: FastifyReply) {
    try {
      logger.info('Retrieving all blocks');

      const blocks = await this.blocksService.getAllBlocks();

      return reply.send({
        success: true,
        blocks,
        count: blocks.length
      });

    } catch (error) {
      logger.error('Failed to retrieve blocks', {}, error as Error);
      
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve blocks'
      });
    }
  }
}
