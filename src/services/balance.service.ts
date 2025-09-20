import logger from '../logger';
import DatabaseConnection from '../database/connection';
import type { TransactionHistoryItem, BalanceInfo } from '../types/balance.types';
import { UTXOService } from './utxo.service';

export class BalanceService {
  private db = DatabaseConnection.getInstance();
  private utxoService = new UTXOService();

  async getBalance(address: string): Promise<BalanceInfo> {
    try {
      logger.info('Getting balance for address', { address });

      // Validate address format
      if (!this.isValidAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Get balance from indexed data
      const balance = await this.getIndexedBalance(address);
      const currency = 'BTC'; // TODO: Make configurable

      const balanceInfo: BalanceInfo = {
        address,
        balance,
        currency,
        lastUpdated: new Date().toISOString()
      };

      logger.info('Balance retrieved successfully', { address, balance });
      return balanceInfo;

    } catch (error) {
      logger.error('Failed to get balance', { address }, error as Error);
      throw error;
    }
  }

  private async getIndexedBalance(address: string): Promise<number> {
    try {
      // Get all UTXOs for this address and sum their values
      const utxos = await this.utxoService.getAddressUTXOs(address);
      const balance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
      
      logger.info('Balance calculated from UTXOs', { address, balance, utxoCount: utxos.length });
      return balance;
    } catch (error) {
      logger.error('Failed to get indexed balance', { address }, error as Error);
      throw error;
    }
  }

  async getTransactionHistory(address: string, limit: number = 10, offset: number = 0): Promise<TransactionHistoryItem[]> {
    try {
      logger.info('Retrieving transaction history', { address, limit, offset });

      // TODO: Get transactions from database with pagination
      const transactions: TransactionHistoryItem[] = [];

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

  // Private helper methods
  private isValidAddress(address: string): boolean {
    // TODO: Implement proper address validation
    return address && address.length >= 10 ? true: false;
  }
}
