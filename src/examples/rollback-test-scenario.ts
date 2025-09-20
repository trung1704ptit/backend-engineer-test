/**
 * Test scenario demonstrating the rollback functionality
 * This file shows how the rollback would work with the provided example
 */

import type { Block, Transaction } from '../types/blocks.types';

// Example blocks from the requirements
export const exampleBlocks: Block[] = [
  {
    id: "hash_of_1_tx1", // SHA256("1" + "tx1")
    height: 1,
    transactions: [{
      id: "tx1",
      inputs: [],
      outputs: [{
        address: "addr1",
        value: 10
      }]
    }]
  },
  {
    id: "hash_of_2_tx2", // SHA256("2" + "tx2")
    height: 2,
    transactions: [{
      id: "tx2",
      inputs: [{
        txId: "tx1",
        index: 0
      }],
      outputs: [{
        address: "addr2",
        value: 4
      }, {
        address: "addr3",
        value: 6
      }]
    }]
  },
  {
    id: "hash_of_3_tx3", // SHA256("3" + "tx3")
    height: 3,
    transactions: [{
      id: "tx3",
      inputs: [{
        txId: "tx2",
        index: 1 // This refers to the second output of tx2 (addr3's 6)
      }],
      outputs: [{
        address: "addr4",
        value: 2
      }, {
        address: "addr5",
        value: 2
      }, {
        address: "addr6",
        value: 2
      }]
    }]
  }
];

// Expected address balances after each block
export const expectedBalances = {
  afterBlock1: {
    "addr1": 10
  },
  afterBlock2: {
    "addr1": 0,  // spent its 10
    "addr2": 4,  // received 4
    "addr3": 6   // received 6
  },
  afterBlock3: {
    "addr1": 0,  // unchanged
    "addr2": 4,  // unchanged
    "addr3": 0,  // spent its 6
    "addr4": 2,  // received 2
    "addr5": 2,  // received 2
    "addr6": 2   // received 2
  },
  afterRollbackToHeight2: {
    "addr1": 0,  // unchanged
    "addr2": 4,  // unchanged
    "addr3": 6   // got back its 6 (tx3 was undone)
  }
};

// UTXO states after each block
export const expectedUTXOs = {
  afterBlock1: [
    { txId: "tx1", outputIndex: 0, address: "addr1", value: 10, blockHeight: 1 }
  ],
  afterBlock2: [
    { txId: "tx2", outputIndex: 0, address: "addr2", value: 4, blockHeight: 2 },
    { txId: "tx2", outputIndex: 1, address: "addr3", value: 6, blockHeight: 2 }
  ],
  afterBlock3: [
    { txId: "tx2", outputIndex: 0, address: "addr2", value: 4, blockHeight: 2 },
    { txId: "tx3", outputIndex: 0, address: "addr4", value: 2, blockHeight: 3 },
    { txId: "tx3", outputIndex: 1, address: "addr5", value: 2, blockHeight: 3 },
    { txId: "tx3", outputIndex: 2, address: "addr6", value: 2, blockHeight: 3 }
  ],
  afterRollbackToHeight2: [
    { txId: "tx2", outputIndex: 0, address: "addr2", value: 4, blockHeight: 2 },
    { txId: "tx2", outputIndex: 1, address: "addr3", value: 6, blockHeight: 2 }
  ]
};

/**
 * Demonstrate rollback process step by step
 */
export function demonstrateRollbackProcess() {
  console.log('=== Rollback Demonstration ===\n');

  console.log('Initial State (Height 1):');
  console.log('Block 1:', JSON.stringify(exampleBlocks[0], null, 2));
  console.log('Balances:', expectedBalances.afterBlock1);
  console.log('UTXOs:', expectedUTXOs.afterBlock1);
  console.log('');

  console.log('After Block 2:');
  console.log('Block 2:', JSON.stringify(exampleBlocks[1], null, 2));
  console.log('Balances:', expectedBalances.afterBlock2);
  console.log('UTXOs:', expectedUTXOs.afterBlock2);
  console.log('');

  console.log('After Block 3:');
  console.log('Block 3:', JSON.stringify(exampleBlocks[2], null, 2));
  console.log('Balances:', expectedBalances.afterBlock3);
  console.log('UTXOs:', expectedUTXOs.afterBlock3);
  console.log('');

  console.log('=== ROLLBACK TO HEIGHT 2 ===');
  console.log('Rollback Process:');
  console.log('1. Identify blocks to rollback: Block 3');
  console.log('2. Undo transaction tx3:');
  console.log('   - Remove outputs: addr4, addr5, addr6 lose their 2 each');
  console.log('   - Restore input: addr3 gets back its 6 (from tx2 output index 1)');
  console.log('3. Remove block 3 from storage');
  console.log('4. Update blockchain state to height 2');
  console.log('');

  console.log('Final State (After Rollback):');
  console.log('Balances:', expectedBalances.afterRollbackToHeight2);
  console.log('UTXOs:', expectedUTXOs.afterRollbackToHeight2);
  console.log('');

  console.log('=== API Call ===');
  console.log('POST /rollback?height=2');
  console.log('Response:');
  console.log(JSON.stringify({
    success: true,
    message: "Successfully rolled back blockchain to height 2",
    rollbackInfo: {
      fromHeight: 3,
      toHeight: 2,
      blocksRemoved: 1,
      timestamp: new Date().toISOString()
    }
  }, null, 2));
}

/**
 * Calculate address balance from UTXO set
 */
export function calculateBalanceFromUTXOs(address: string, utxos: any[]): number {
  return utxos
    .filter(utxo => utxo.address === address)
    .reduce((sum, utxo) => sum + utxo.value, 0);
}

/**
 * Verify that balances match expected values
 */
export function verifyBalances(actualUTXOs: any[], expectedBalances: Record<string, number>): boolean {
  for (const [address, expectedBalance] of Object.entries(expectedBalances)) {
    const actualBalance = calculateBalanceFromUTXOs(address, actualUTXOs);
    if (actualBalance !== expectedBalance) {
      console.error(`Balance mismatch for ${address}: expected ${expectedBalance}, got ${actualBalance}`);
      return false;
    }
  }
  return true;
}

// Run demonstration if this file is executed directly
if (import.meta.main) {
  demonstrateRollbackProcess();
}
