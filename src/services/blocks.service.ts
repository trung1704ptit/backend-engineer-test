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

      const currentHeight = await this.getCurrentBlockHeight();

      const heightValidation = BlockValidator.validateBlockHeight(block.height, currentHeight);
      if (!heightValidation.isValid) {
        throw new Error(heightValidation.error!);
      }

      const idValidation = BlockValidator.validateBlockId(block);
      if (!idValidation.isValid) {
        throw new Error(idValidation.error!);
      }

      const transactionValidation = await TransactionValidator.validateTransactions(
        block.transactions,
        (input) => this.utxoService.getInputValue(input)
      );
      if (!transactionValidation.isValid) {
        throw new Error(`Transaction validation failed: ${transactionValidation.errors.join(', ')}`);
      }

      for (const transaction of block.transactions) {
        await this.utxoService.processTransaction(transaction, block.height);
      }

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
      
      const result = await this.db.query(
        'SELECT data FROM blocks ORDER BY height ASC'
      );
      
      const blocks: Block[] = result.rows.map((row: any) => row.data);
      
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

      const result = await this.db.query(
        'SELECT data FROM blocks WHERE height = $1',
        [height]
      );

      if (result.rows.length === 0) {
        logger.warn('Block not found', { height });
        return null;
      }

      const block: Block = result.rows[0].data;
      logger.info('Block retrieved successfully', { height });
      return block;

    } catch (error) {
      logger.error('Failed to retrieve block', { height }, error as Error);
      throw error;
    }
  }

  async getCurrentBlockHeight(): Promise<number> {
    try {
      logger.info('Getting current block height');
      
      const result = await this.db.query(
        'SELECT COALESCE(MAX(height), 0) as height FROM blocks'
      );
      
      const height = parseInt(result.rows[0].height);
      
      logger.info('Current block height retrieved', { height });
      return height;

    } catch (error) {
      logger.error('Failed to get current block height', {}, error as Error);
      throw error;
    }
  }


  // Private helper methods
  private async saveBlock(block: Block): Promise<void> {
    try {
      logger.info('Saving block to database', { blockId: block.id, height: block.height });
      
      await this.db.query(
        'INSERT INTO blocks (id, height, data) VALUES ($1, $2, $3)',
        [block.id, block.height, JSON.stringify(block)]
      );
      
      logger.info('Block saved successfully', { blockId: block.id, height: block.height });

    } catch (error) {
      logger.error('Failed to save block', { blockId: block.id }, error as Error);
      throw error;
    }
  }
}
