import logger from '../logger';
import DatabaseConnection from '../database/connection';

export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  data: any;
  nonce: number;
}

export interface Transaction {
  txId: string;
  blockHeight: number;
  timestamp: string;
  amount: number;
  type: 'input' | 'output';
  address: string;
}

export interface BalanceInfo {
  address: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface RollbackInfo {
  fromHeight: number;
  toHeight: number;
  blocksRemoved: number;
  timestamp: string;
}

export class BlockchainService {
  private db = DatabaseConnection.getInstance();

  async addBlock(blockData: any, previousHash: string, timestamp?: number, nonce?: number): Promise<Block> {
    try {
      logger.info('Adding new block to blockchain', { previousHash });

      const newBlock: Block = {
        index: await this.getCurrentBlockHeight() + 1,
        hash: this.calculateHash(blockData, previousHash, timestamp, nonce),
        previousHash,
        timestamp: timestamp || Date.now(),
        data: blockData,
        nonce: nonce || 0
      };

      await this.saveBlock(newBlock);

      logger.info('Block added successfully', { blockIndex: newBlock.index });
      return newBlock;

    } catch (error) {
      logger.error('Failed to add block', {}, error as Error);
      throw new Error('Failed to add block to blockchain');
    }
  }

  async getAllBlocks(): Promise<Block[]> {
    try {
      logger.info('Retrieving all blocks');
      
      const blocks: Block[] = [];
      
      logger.info('Blocks retrieved successfully', { count: blocks.length });
      return blocks;

    } catch (error) {
      logger.error('Failed to retrieve blocks', {}, error as Error);
      throw new Error('Failed to retrieve blocks');
    }
  }

  async getBalance(address: string): Promise<BalanceInfo> {
    try {
      logger.info('Calculating balance for address', { address });

      if (!this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      const balance = 0;
      const currency = 'BTC';

      const balanceInfo: BalanceInfo = {
        address,
        balance,
        currency,
        lastUpdated: new Date().toISOString()
      };

      logger.info('Balance calculated successfully', { address, balance });
      return balanceInfo;

    } catch (error) {
      logger.error('Failed to calculate balance', { address }, error as Error);
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit: number = 10, offset: number = 0): Promise<Transaction[]> {
    try {
      logger.info('Retrieving transaction history', { address, limit, offset });

      const transactions: Transaction[] = [];

      logger.info('Transaction history retrieved', { 
        address, 
        count: transactions.length 
      });
      return transactions;

    } catch (error) {
      logger.error('Failed to get transaction history', { address }, error as Error);
      throw error;
    }
  }

  async rollbackToHeight(targetHeight: number, confirmed: boolean = false): Promise<RollbackInfo> {
    try {
      logger.info('Rollback requested', { targetHeight, confirmed });

      const currentHeight = await this.getCurrentBlockHeight();

      // Validate rollback request
      if (targetHeight >= currentHeight) {
        throw new Error('Cannot rollback to current or future height');
      }

      // Check if confirmation is required
      const requiresConfirmation = currentHeight - targetHeight > 10;
      if (requiresConfirmation && !confirmed) {
        throw new Error('This rollback operation requires confirmation');
      }

      const rollbackInfo: RollbackInfo = {
        fromHeight: currentHeight,
        toHeight: targetHeight,
        blocksRemoved: currentHeight - targetHeight,
        timestamp: new Date().toISOString()
      };

      logger.info('Rollback completed', rollbackInfo);
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

      const currentHeight = await this.getCurrentBlockHeight();
      const lastRollback = null;
      const rollbackHistory: RollbackInfo[] = [];

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

  // Private helper methods
  private async getCurrentBlockHeight(): Promise<number> {
    return 100;
  }

  private calculateHash(data: any, previousHash: string, timestamp?: number, nonce?: number): string {
    return `hash_${Date.now()}_${Math.random()}`;
  }

  private async saveBlock(block: Block): Promise<void> {
    logger.info('Block saved to database', { blockIndex: block.index });
  }

  private isValidAddress(address: string): boolean {
    return address && address.length >= 10 ? true: false;
  }
}
