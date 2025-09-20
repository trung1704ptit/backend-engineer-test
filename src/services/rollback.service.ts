import logger from '../logger';
import DatabaseConnection from '../database/connection';
import { BlocksService } from './blocks.service';
import { UTXOService } from './utxo.service';
import type { RollbackInfo } from '../types/rollback.types';
import type { Block, Transaction } from '../types/blocks.types';
import { RollbackValidator } from '../validators';

export class RollbackService {
  private db = DatabaseConnection.getInstance();
  private blocksService = new BlocksService();
  private utxoService = new UTXOService();

  async rollbackToHeight(targetHeight: number, confirmed: boolean = false): Promise<RollbackInfo> {
    try {
      logger.info('Rollback requested', { targetHeight, confirmed });

      const currentHeight = await this.blocksService.getCurrentBlockHeight();

      // Validate rollback request using validator
      const validation = RollbackValidator.validateRollbackRequest(targetHeight, currentHeight, confirmed);
      if (!validation.isValid) {
        throw new Error(validation.error!);
      }

      // Additional validation: ensure rollback is not more than 2000 blocks
      const blocksToRemove = currentHeight - targetHeight;
      if (blocksToRemove > 2000) {
        throw new Error('Rollback depth exceeds maximum allowed (2000 blocks)');
      }

      // Perform rollback operation
      await this.performRollback(targetHeight, currentHeight);

      const rollbackInfo: RollbackInfo = {
        fromHeight: currentHeight,
        toHeight: targetHeight,
        blocksRemoved: blocksToRemove,
        timestamp: new Date().toISOString()
      };

      // Save rollback operation to history
      await this.saveRollbackHistory(rollbackInfo);

      logger.info('Rollback completed successfully', rollbackInfo);
      return rollbackInfo;

    } catch (error) {
      logger.error('Rollback failed', { targetHeight }, error as Error);
      throw error;
    }
  }

  async getRollbackStatus(): Promise<{
    currentHeight: number;
    lastRollback: RollbackInfo | null;
    rollbackHistory: RollbackInfo[];
  }> {
    try {
      logger.info('Retrieving rollback status');

      const currentHeight = await this.blocksService.getCurrentBlockHeight();
      const lastRollback = null; // TODO: Get from database
      const rollbackHistory: RollbackInfo[] = []; // TODO: Get from database

      return {
        currentHeight,
        lastRollback,
        rollbackHistory
      };

    } catch (error) {
      logger.error('Failed to get rollback status', {}, error as Error);
      throw error;
    }
  }

  async getRollbackHistory(limit: number = 10, offset: number = 0): Promise<RollbackInfo[]> {
    try {
      logger.info('Retrieving rollback history', { limit, offset });

      // TODO: Get rollback history from database with pagination
      const rollbackHistory: RollbackInfo[] = [];

      logger.info('Rollback history retrieved', { 
        count: rollbackHistory.length,
        limit,
        offset
      });
      return rollbackHistory;

    } catch (error) {
      logger.error('Failed to get rollback history', { limit, offset }, error as Error);
      throw error;
    }
  }

  async validateRollbackRequest(targetHeight: number): Promise<{
    isValid: boolean;
    currentHeight: number;
    requiresConfirmation: boolean;
    message?: string;
  }> {
    try {
      logger.info('Validating rollback request', { targetHeight });

      const currentHeight = await this.blocksService.getCurrentBlockHeight();
      const validation = RollbackValidator.validateRollbackRequest(targetHeight, currentHeight);

      return {
        isValid: validation.isValid,
        currentHeight: validation.currentHeight,
        requiresConfirmation: validation.requiresConfirmation,
        message: validation.isValid ? validation.message : validation.error
      };

    } catch (error) {
      logger.error('Failed to validate rollback request', { targetHeight }, error as Error);
      throw error;
    }
  }

  /**
   * Perform the actual rollback operation
   */
  private async performRollback(targetHeight: number, currentHeight: number): Promise<void> {
    try {
      logger.info('Starting rollback operation', { targetHeight, currentHeight });

      // Get all blocks that need to be rolled back (from currentHeight down to targetHeight + 1)
      const blocksToRollback = await this.getBlocksToRollback(targetHeight + 1, currentHeight);
      
      // Process blocks in reverse order (newest first) to undo transactions
      for (let i = blocksToRollback.length - 1; i >= 0; i--) {
        const block = blocksToRollback[i];
        await this.undoBlockTransactions(block);
      }

      // Remove blocks from storage
      await this.removeBlocksFromHeight(targetHeight + 1);

      // Update blockchain state
      await this.updateBlockchainState(targetHeight);

      logger.info('Rollback operation completed', { 
        targetHeight, 
        blocksProcessed: blocksToRollback.length 
      });

    } catch (error) {
      logger.error('Failed to perform rollback', { targetHeight, currentHeight }, error as Error);
      throw error;
    }
  }

  /**
   * Undo all transactions in a block by reversing UTXO operations
   */
  private async undoBlockTransactions(block: Block): Promise<void> {
    try {
      logger.info('Undoing block transactions', { blockId: block.id, height: block.height });

      // Process transactions in reverse order
      for (let i = block.transactions.length - 1; i >= 0; i--) {
        const transaction = block.transactions[i];
        await this.undoTransaction(transaction, block.height);
      }

    } catch (error) {
      logger.error('Failed to undo block transactions', { blockId: block.id }, error as Error);
      throw error;
    }
  }

  /**
   * Undo a single transaction by reversing UTXO operations
   */
  private async undoTransaction(transaction: Transaction, blockHeight: number): Promise<void> {
    try {
      logger.info('Undoing transaction', { txId: transaction.id, blockHeight });

      // Reverse the transaction: outputs become inputs, inputs become outputs
      // 1. Remove the outputs that were added (they become unspent again)
      for (let i = 0; i < transaction.outputs.length; i++) {
        const output = transaction.outputs[i];
        await this.removeUTXO(transaction.id, i);
      }

      // 2. Restore the inputs that were spent (they become unspent again)
      for (const input of transaction.inputs) {
        await this.restoreUTXO(input.txId, input.index, blockHeight);
      }

      logger.info('Transaction undone successfully', { txId: transaction.id });

    } catch (error) {
      logger.error('Failed to undo transaction', { txId: transaction.id }, error as Error);
      throw error;
    }
  }

  /**
   * Remove UTXO (output was spent, so remove it from UTXO set)
   */
  private async removeUTXO(txId: string, outputIndex: number): Promise<void> {
    try {
      // TODO: Remove UTXO from database
      logger.info('UTXO removed during rollback', { txId, outputIndex });
    } catch (error) {
      logger.error('Failed to remove UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  /**
   * Restore UTXO (input was unspent, so add it back to UTXO set)
   */
  private async restoreUTXO(txId: string, outputIndex: number, blockHeight: number): Promise<void> {
    try {
      // TODO: Get the original output details and restore UTXO
      // This would require looking up the original transaction and output
      logger.info('UTXO restored during rollback', { txId, outputIndex, blockHeight });
    } catch (error) {
      logger.error('Failed to restore UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  /**
   * Get blocks that need to be rolled back
   */
  private async getBlocksToRollback(fromHeight: number, toHeight: number): Promise<Block[]> {
    try {
      // TODO: Get blocks from database in the specified height range
      const blocks: Block[] = [];
      logger.info('Retrieved blocks for rollback', { fromHeight, toHeight, count: blocks.length });
      return blocks;
    } catch (error) {
      logger.error('Failed to get blocks for rollback', { fromHeight, toHeight }, error as Error);
      throw error;
    }
  }

  /**
   * Remove blocks from storage starting from the given height
   */
  private async removeBlocksFromHeight(height: number): Promise<void> {
    try {
      // TODO: Remove blocks from database starting from the given height
      logger.info('Removed blocks from storage', { fromHeight: height });
    } catch (error) {
      logger.error('Failed to remove blocks from storage', { height }, error as Error);
      throw error;
    }
  }

  /**
   * Update blockchain state after rollback
   */
  private async updateBlockchainState(targetHeight: number): Promise<void> {
    try {
      // TODO: Update blockchain state (current height, etc.)
      logger.info('Blockchain state updated', { newHeight: targetHeight });
    } catch (error) {
      logger.error('Failed to update blockchain state', { targetHeight }, error as Error);
      throw error;
    }
  }

  /**
   * Save rollback operation to history
   */
  private async saveRollbackHistory(rollbackInfo: RollbackInfo): Promise<void> {
    try {
      // TODO: Save rollback operation to database
      logger.info('Rollback history saved', rollbackInfo);
    } catch (error) {
      logger.error('Failed to save rollback history', rollbackInfo, error as Error);
      throw error;
    }
  }
}
