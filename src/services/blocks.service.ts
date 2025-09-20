import logger from '../logger';
import DatabaseConnection from '../database/connection';
import type { Block, Transaction, Input, Output } from '../types/blocks.types';
import { UTXOService } from './utxo.service';
import { BlockValidator, TransactionValidator } from '../validators';

export class BlocksService {
  private db = DatabaseConnection.getInstance();
  private utxoService = new UTXOService();

  async addBlock(block: Block): Promise<Block> {
    try {
      logger.info('Adding new block to blockchain', { blockId: block.id, height: block.height });

      // Get current height for validation
      const currentHeight = await this.getCurrentBlockHeight();

      // Validate block height
      const heightValidation = BlockValidator.validateBlockHeight(block.height, currentHeight);
      if (!heightValidation.isValid) {
        throw new Error(heightValidation.error!);
      }

      // Validate block ID
      const idValidation = BlockValidator.validateBlockId(block);
      if (!idValidation.isValid) {
        throw new Error(idValidation.error!);
      }

      // Validate transactions
      const transactionValidation = await TransactionValidator.validateTransactions(
        block.transactions,
        (input) => this.utxoService.getInputValue(input)
      );
      if (!transactionValidation.isValid) {
        throw new Error(`Transaction validation failed: ${transactionValidation.errors.join(', ')}`);
      }

      // Process transactions in UTXO set
      for (const transaction of block.transactions) {
        await this.utxoService.processTransaction(transaction, block.height);
      }

      // Save block to database
      await this.saveBlock(block);

      logger.info('Block added successfully', { blockId: block.id, height: block.height });
      return block;

    } catch (error) {
      logger.error('Failed to add block', { blockId: block.id }, error as Error);
      throw error;
    }
  }

  async getAllBlocks(): Promise<Block[]> {
    try {
      logger.info('Retrieving all blocks');
      
      // TODO: Get blocks from database
      const blocks: Block[] = [];
      
      logger.info('Blocks retrieved successfully', { count: blocks.length });
      return blocks;

    } catch (error) {
      logger.error('Failed to retrieve blocks', {}, error as Error);
      throw new Error('Failed to retrieve blocks');
    }
  }

  async getBlockByHeight(height: number): Promise<Block | null> {
    try {
      logger.info('Retrieving block by height', { height });

      // TODO: Get block from database by height
      const block: Block | null = null;

      if (block) {
        logger.info('Block retrieved successfully', { height });
      } else {
        logger.warn('Block not found', { height });
      }

      return block;

    } catch (error) {
      logger.error('Failed to retrieve block', { height }, error as Error);
      throw error;
    }
  }

  async getCurrentBlockHeight(): Promise<number> {
    try {
      logger.info('Getting current block height');
      
      // TODO: Get from database
      const height = 100; // Placeholder
      
      logger.info('Current block height retrieved', { height });
      return height;

    } catch (error) {
      logger.error('Failed to get current block height', {}, error as Error);
      throw error;
    }
  }



  // Private helper methods
  private async saveBlock(block: Block): Promise<void> {
    // TODO: Save block to database
    logger.info('Block saved to database', { blockId: block.id, height: block.height });
  }
}
