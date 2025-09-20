import logger from '../logger';
import DatabaseConnection from '../database/connection';
import type { Input, Output, Transaction } from '../types/blocks.types';
import { UTXOValidator } from '../validators';

export interface UTXO {
  txId: string;
  outputIndex: number;
  address: string;
  value: number;
  blockHeight: number;
}

export class UTXOService {
  private db = DatabaseConnection.getInstance();

  async processTransaction(transaction: Transaction, blockHeight: number): Promise<void> {
    try {
      // Remove spent outputs (inputs)
      for (const input of transaction.inputs) {
        await this.removeUTXO(input.txId, input.index);
      }

      // Add new outputs
      for (let i = 0; i < transaction.outputs.length; i++) {
        const output = transaction.outputs[i];
        await this.addUTXO({
          txId: transaction.id,
          outputIndex: i,
          address: output.address,
          value: output.value,
          blockHeight
        });
      }

      logger.info('Transaction processed in UTXO set', { 
        txId: transaction.id, 
        inputs: transaction.inputs.length, 
        outputs: transaction.outputs.length 
      });
    } catch (error) {
      logger.error('Failed to process transaction in UTXO set', { txId: transaction.id }, error as Error);
      throw error;
    }
  }

  async getInputValue(input: Input): Promise<number> {
    try {
      const utxo = await this.getUTXO(input.txId, input.index);
      return utxo ? utxo.value : 0;
    } catch (error) {
      logger.error('Failed to get input value', { txId: input.txId, index: input.index }, error as Error);
      throw error;
    }
  }

  async validateInputExists(input: Input): Promise<boolean> {
    try {
      const validation = await UTXOValidator.validateInputExists(input, (txId, index) => this.getUTXO(txId, index));
      return validation.isValid && validation.exists;
    } catch (error) {
      logger.error('Failed to validate input exists', { txId: input.txId, index: input.index }, error as Error);
      return false;
    }
  }

  private async addUTXO(utxo: UTXO): Promise<void> {
    try {
      // TODO: Save UTXO to database
      logger.info('UTXO added', { 
        txId: utxo.txId, 
        outputIndex: utxo.outputIndex, 
        address: utxo.address, 
        value: utxo.value 
      });
    } catch (error) {
      logger.error('Failed to add UTXO', utxo, error as Error);
      throw error;
    }
  }

  private async removeUTXO(txId: string, outputIndex: number): Promise<void> {
    try {
      // TODO: Remove UTXO from database
      logger.info('UTXO removed', { txId, outputIndex });
    } catch (error) {
      logger.error('Failed to remove UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  private async getUTXO(txId: string, outputIndex: number): Promise<UTXO | null> {
    try {
      // TODO: Get UTXO from database
      // For now, return null as placeholder
      return null;
    } catch (error) {
      logger.error('Failed to get UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  async getAddressUTXOs(address: string): Promise<UTXO[]> {
    try {
      // TODO: Get all UTXOs for an address from database
      const utxos: UTXO[] = [];
      logger.info('Address UTXOs retrieved', { address, count: utxos.length });
      return utxos;
    } catch (error) {
      logger.error('Failed to get address UTXOs', { address }, error as Error);
      throw error;
    }
  }
}
