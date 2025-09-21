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

  async rollbackToHeight(targetHeight: number): Promise<RollbackInfo> {
    try {
      logger.info('Rollback requested', { targetHeight });

      const currentHeight = await this.blocksService.getCurrentBlockHeight();

      const validation = RollbackValidator.validateRollbackRequest(targetHeight, currentHeight);
      if (!validation.isValid) {
        throw new Error(validation.error!);
      }

      const blocksToRemove = currentHeight - targetHeight;
      if (blocksToRemove > 2000) {
        throw new Error('Rollback depth exceeds maximum allowed (2000 blocks)');
      }

      await this.performRollback(targetHeight, currentHeight);

      const rollbackInfo: RollbackInfo = {
        fromHeight: currentHeight,
        toHeight: targetHeight,
        blocksRemoved: blocksToRemove,
        timestamp: new Date().toISOString()
      };

      await this.saveRollbackHistory(rollbackInfo);

      logger.info('Rollback completed successfully', rollbackInfo);
      return rollbackInfo;

    } catch (error) {
      console.log(error)
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
      
      const lastRollbackResult = await this.db.query(
        'SELECT from_height, to_height, blocks_removed, timestamp FROM rollback_history ORDER BY timestamp DESC LIMIT 1'
      );
      
      const lastRollback = lastRollbackResult.rows.length > 0 ? {
        fromHeight: lastRollbackResult.rows[0].from_height,
        toHeight: lastRollbackResult.rows[0].to_height,
        blocksRemoved: lastRollbackResult.rows[0].blocks_removed,
        timestamp: lastRollbackResult.rows[0].timestamp
      } : null;

      const historyResult = await this.db.query(
        'SELECT from_height, to_height, blocks_removed, timestamp FROM rollback_history ORDER BY timestamp DESC LIMIT 10'
      );
      
      const rollbackHistory: RollbackInfo[] = historyResult.rows.map((row: any) => ({
        fromHeight: row.from_height,
        toHeight: row.to_height,
        blocksRemoved: row.blocks_removed,
        timestamp: row.timestamp
      }));

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

      const result = await this.db.query(
        'SELECT from_height, to_height, blocks_removed, timestamp FROM rollback_history ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      const rollbackHistory: RollbackInfo[] = result.rows.map((row: any) => ({
        fromHeight: row.from_height,
        toHeight: row.to_height,
        blocksRemoved: row.blocks_removed,
        timestamp: row.timestamp
      }));

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

      const blocksToRollback = await this.getBlocksToRollback(targetHeight + 1, currentHeight);
      
      for (let i = blocksToRollback.length - 1; i >= 0; i--) {
        const block = blocksToRollback[i];
        await this.undoBlockTransactions(block);
      }

      await this.removeBlocksFromHeight(targetHeight + 1);

      if (targetHeight === 0) {
        await this.clearAllUTXOs();
      } else {
        await this.clearUTXOsFromHeight(targetHeight + 1);
      }

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

      for (let i = 0; i < transaction.outputs.length; i++) {
        const output = transaction.outputs[i];
        await this.removeUTXO(transaction.id, i);
      }

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
      await this.db.query(
        'DELETE FROM utxos WHERE tx_id = $1 AND output_index = $2',
        [txId, outputIndex]
      );
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
      const result = await this.db.query(
        'SELECT data FROM blocks WHERE data @> $1',
        [`{"transactions":[{"id":"${txId}"}]}`]
      );

      if (result.rows.length === 0) {
        throw new Error(`Transaction ${txId} not found in any block`);
      }

      const block = result.rows[0].data;
      const transaction = block.transactions.find((tx: any) => tx.id === txId);
      
      if (!transaction) {
        throw new Error(`Transaction ${txId} not found`);
      }

      const output = transaction.outputs[outputIndex];
      if (!output) {
        throw new Error(`Output ${outputIndex} not found in transaction ${txId}`);
      }

      await this.db.query(
        'INSERT INTO utxos (tx_id, output_index, address, value, block_height) VALUES ($1, $2, $3, $4, $5)',
        [txId, outputIndex, output.address, output.value, block.height]
      );

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
      const result = await this.db.query(
        'SELECT data FROM blocks WHERE height >= $1 AND height <= $2 ORDER BY height DESC',
        [fromHeight, toHeight]
      );
      
      const blocks: Block[] = result.rows.map((row: any) => row.data);
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
      await this.db.query(
        'DELETE FROM blocks WHERE height >= $1',
        [height]
      );
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
      logger.info('Blockchain state updated', { newHeight: targetHeight });
    } catch (error) {
      logger.error('Failed to update blockchain state', { targetHeight }, error as Error);
      throw error;
    }
  }

  /**
   * Clear UTXOs from blocks at or above the given height
   */
  private async clearUTXOsFromHeight(height: number): Promise<void> {
    try {
      await this.db.query('DELETE FROM utxos WHERE block_height >= $1', [height]);
      logger.info('UTXOs cleared from height', { fromHeight: height });
    } catch (error) {
      logger.error('Failed to clear UTXOs from height', { height }, error as Error);
      throw error;
    }
  }

  /**
   * Clear all UTXOs (used when rolling back to height 0)
   */
  async clearAllUTXOs(): Promise<void> {
    try {
      await this.db.query('DELETE FROM utxos');
      logger.info('All UTXOs cleared during rollback to height 0');
    } catch (error) {
      logger.error('Failed to clear all UTXOs', {}, error as Error);
      throw error;
    }
  }

  /**
   * Save rollback operation to history
   */
  private async saveRollbackHistory(rollbackInfo: RollbackInfo): Promise<void> {
    try {
      await this.db.query(
        'INSERT INTO rollback_history (from_height, to_height, blocks_removed, timestamp) VALUES ($1, $2, $3, $4)',
        [rollbackInfo.fromHeight, rollbackInfo.toHeight, rollbackInfo.blocksRemoved, rollbackInfo.timestamp]
      );
      logger.info('Rollback history saved', rollbackInfo);
    } catch (error) {
      logger.error('Failed to save rollback history', rollbackInfo, error as Error);
      throw error;
    }
  }
}
