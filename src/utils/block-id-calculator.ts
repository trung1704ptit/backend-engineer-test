import crypto from 'crypto';
import type { Block, Transaction } from '../types/blocks.types';

/**
 * Utility class for calculating block IDs according to the specification
 */
export class BlockIdCalculator {
  /**
   * Calculate the expected block ID based on height and transaction IDs
   * @param height - The block height
   * @param transactions - Array of transactions in the block
   * @returns SHA256 hash of height + concatenated transaction IDs
   */
  static calculateBlockId(height: number, transactions: Transaction[]): string {
    const dataToHash = height.toString() + transactions.map(tx => tx.id).join('');
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Validate if a block has the correct ID
   * @param block - The block to validate
   * @returns true if the block ID is correct, false otherwise
   */
  static validateBlockId(block: Block): boolean {
    const expectedId = this.calculateBlockId(block.height, block.transactions);
    return block.id === expectedId;
  }

  /**
   * Calculate transaction balance (sum of inputs vs outputs)
   * Note: This is a placeholder - in practice, you need UTXO lookup
   * @param transaction - The transaction to analyze
   * @returns Object with inputSum, outputSum, and isBalanced
   */
  static calculateTransactionBalance(transaction: Transaction): {
    inputSum: number;
    outputSum: number;
    isBalanced: boolean;
  } {
    const outputSum = transaction.outputs.reduce((sum, output) => sum + output.value, 0);
    
    // Note: Input sum calculation requires UTXO lookup in real implementation
    const inputSum = 0; // Placeholder - would need UTXO service
    
    return {
      inputSum,
      outputSum,
      isBalanced: inputSum === outputSum
    };
  }
}

/**
 * Example usage and testing
 */
export function demonstrateBlockIdCalculation() {
  console.log('=== Block ID Calculation Examples ===\n');

  // Example 1: Genesis block
  const genesisBlock = {
    id: '',
    height: 1,
    transactions: [
      {
        id: 'tx1',
        inputs: [],
        outputs: [
          { address: 'address1', value: 100 }
        ]
      }
    ]
  };

  const genesisId = BlockIdCalculator.calculateBlockId(genesisBlock.height, genesisBlock.transactions);
  console.log('Genesis Block:');
  console.log(`Height: ${genesisBlock.height}`);
  console.log(`Transaction IDs: ${genesisBlock.transactions.map(tx => tx.id).join(', ')}`);
  console.log(`Expected ID: ${genesisId}`);
  console.log(`Data to hash: "${genesisBlock.height}${genesisBlock.transactions.map(tx => tx.id).join('')}"`);
  console.log('');

  // Example 2: Second block
  const secondBlock = {
    id: '',
    height: 2,
    transactions: [
      {
        id: 'tx2',
        inputs: [{ txId: 'tx1', index: 0 }],
        outputs: [
          { address: 'address2', value: 50 },
          { address: 'address1', value: 50 }
        ]
      }
    ]
  };

  const secondId = BlockIdCalculator.calculateBlockId(secondBlock.height, secondBlock.transactions);
  console.log('Second Block:');
  console.log(`Height: ${secondBlock.height}`);
  console.log(`Transaction IDs: ${secondBlock.transactions.map(tx => tx.id).join(', ')}`);
  console.log(`Expected ID: ${secondId}`);
  console.log(`Data to hash: "${secondBlock.height}${secondBlock.transactions.map(tx => tx.id).join('')}"`);
  console.log('');

  // Example 3: Multiple transactions
  const multiTxBlock = {
    id: '',
    height: 3,
    transactions: [
      {
        id: 'tx3',
        inputs: [{ txId: 'tx2', index: 0 }],
        outputs: [{ address: 'address3', value: 30 }]
      },
      {
        id: 'tx4',
        inputs: [{ txId: 'tx2', index: 1 }],
        outputs: [{ address: 'address4', value: 25 }]
      }
    ]
  };

  const multiTxId = BlockIdCalculator.calculateBlockId(multiTxBlock.height, multiTxBlock.transactions);
  console.log('Multi-Transaction Block:');
  console.log(`Height: ${multiTxBlock.height}`);
  console.log(`Transaction IDs: ${multiTxBlock.transactions.map(tx => tx.id).join(', ')}`);
  console.log(`Expected ID: ${multiTxId}`);
  console.log(`Data to hash: "${multiTxBlock.height}${multiTxBlock.transactions.map(tx => tx.id).join('')}"`);
}

// Run demonstration if this file is executed directly
if (import.meta.main) {
  demonstrateBlockIdCalculation();
}
