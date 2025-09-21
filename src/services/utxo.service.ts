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
      for (const input of transaction.inputs) {
        await this.removeUTXO(input.txId, input.index);
      }

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
      await this.db.query(
        'INSERT INTO utxos (tx_id, output_index, address, value, block_height) VALUES ($1, $2, $3, $4, $5)',
        [utxo.txId, utxo.outputIndex, utxo.address, utxo.value, utxo.blockHeight]
      );
      
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
      await this.db.query(
        'DELETE FROM utxos WHERE tx_id = $1 AND output_index = $2',
        [txId, outputIndex]
      );
      
      logger.info('UTXO removed', { txId, outputIndex });
    } catch (error) {
      logger.error('Failed to remove UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  private async getUTXO(txId: string, outputIndex: number): Promise<UTXO | null> {
    try {
      const result = await this.db.query(
        'SELECT tx_id, output_index, address, value, block_height FROM utxos WHERE tx_id = $1 AND output_index = $2',
        [txId, outputIndex]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        txId: row.tx_id,
        outputIndex: row.output_index,
        address: row.address,
        value: parseFloat(row.value),
        blockHeight: row.block_height
      };
    } catch (error) {
      logger.error('Failed to get UTXO', { txId, outputIndex }, error as Error);
      throw error;
    }
  }

  async getAddressUTXOs(address: string): Promise<UTXO[]> {
    try {
      const result = await this.db.query(
        'SELECT tx_id, output_index, address, value, block_height FROM utxos WHERE address = $1',
        [address]
      );
      
      const utxos: UTXO[] = result.rows.map((row: any) => ({
        txId: row.tx_id,
        outputIndex: row.output_index,
        address: row.address,
        value: parseFloat(row.value),
        blockHeight: row.block_height
      }));
      
      logger.info('Address UTXOs retrieved', { address, count: utxos.length });
      return utxos;
    } catch (error) {
      logger.error('Failed to get address UTXOs', { address }, error as Error);
      throw error;
    }
  }
}
