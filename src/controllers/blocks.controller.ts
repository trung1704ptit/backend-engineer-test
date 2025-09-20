import { type FastifyRequest, type FastifyReply } from 'fastify';
import logger from '../logger';
import { BlocksService } from '../services/blocks.service';
import type { AddBlockRequest, GetBlocksRequest } from '../types/blocks.types';

export class BlocksController {
  private blocksService = new BlocksService();

  async addBlock(request: FastifyRequest<AddBlockRequest>, reply: FastifyReply) {
    try {
      const { data, previousHash, timestamp, nonce } = request.body;
      
      logger.info('Adding new block', { 
        previousHash, 
        dataKeys: Object.keys(data || {}),
        timestamp,
        nonce 
      });

      const newBlock = await this.blocksService.addBlock(
        data, 
        previousHash, 
        timestamp, 
        nonce
      );

      return reply.code(201).send({
        success: true,
        block: newBlock,
        message: 'Block added successfully'
      });

    } catch (error) {
      logger.error('Failed to add block', {}, error as Error);
      
      return reply.code(400).send({
        success: false,
        error: 'Failed to add block to blockchain'
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
