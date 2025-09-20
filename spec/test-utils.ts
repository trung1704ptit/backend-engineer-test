import { expect } from "bun:test";
import crypto from 'crypto';
import type { Block, Transaction, Input, Output } from '../src/types/blocks.types';
import type { UTXO } from '../src/services/utxo.service';

/**
 * Test utilities and mock data for comprehensive testing
 */

// Mock logger that doesn't output during tests
export const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
};

// Mock database connection
export class MockDatabaseConnection {
  private static instance: MockDatabaseConnection;
  private data: Map<string, any[]> = new Map();

  static getInstance(): MockDatabaseConnection {
    if (!MockDatabaseConnection.instance) {
      MockDatabaseConnection.instance = new MockDatabaseConnection();
    }
    return MockDatabaseConnection.instance;
  }

  async query(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    // Mock query implementation
    return { rows: [] };
  }

  async connect(): Promise<void> {
    // Mock connection
  }

  // Mock data storage for tests
  setData(table: string, data: any[]): void {
    this.data.set(table, data);
  }

  getData(table: string): any[] {
    return this.data.get(table) || [];
  }

  clearData(): void {
    this.data.clear();
  }
}

// Test data factories
export class TestDataFactory {
  static createInput(txId: string = 'tx1', index: number = 0): Input {
    return { txId, index };
  }

  static createOutput(address: string = 'addr1', value: number = 10): Output {
    return { address, value };
  }

  static createTransaction(
    id: string = 'tx1',
    inputs: Input[] = [],
    outputs: Output[] = []
  ): Transaction {
    return { id, inputs, outputs };
  }

  static createBlock(
    id: string = 'block1',
    height: number = 1,
    transactions: Transaction[] = []
  ): Block {
    return { id, height, transactions };
  }

  static createUTXO(
    txId: string = 'tx1',
    outputIndex: number = 0,
    address: string = 'addr1',
    value: number = 10,
    blockHeight: number = 1
  ): UTXO {
    return { txId, outputIndex, address, value, blockHeight };
  }

  // Create the example scenario from requirements
  static createExampleScenario(): {
    block1: Block;
    block2: Block;
    block3: Block;
    expectedBalances: Record<string, Record<string, number>>;
  } {
    // Use valid Bitcoin addresses
    const addr1 = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const addr2 = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
    const addr3 = '1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4';
    const addr4 = '1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6';
    const addr5 = '1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8';
    const addr6 = '1F7kwW9iIx6Z6Mi1D3G3vH1eI6lJ7nO8qQ9';

    const tx1 = {
      id: 'tx1',
      inputs: [],
      outputs: [{ address: addr1, value: 10 }]
    };

    const tx2 = {
      id: 'tx2',
      inputs: [{ txId: 'tx1', index: 0 }],
      outputs: [
        { address: addr2, value: 4 },
        { address: addr3, value: 6 }
      ]
    };

    const tx3 = {
      id: 'tx3',
      inputs: [{ txId: 'tx2', index: 1 }],
      outputs: [
        { address: addr4, value: 2 },
        { address: addr5, value: 2 },
        { address: addr6, value: 2 }
      ]
    };

    // Calculate proper block IDs
    const block1: Block = {
      id: this.calculateBlockId(1, [tx1]),
      height: 1,
      transactions: [tx1]
    };

    const block2: Block = {
      id: this.calculateBlockId(2, [tx2]),
      height: 2,
      transactions: [tx2]
    };

    const block3: Block = {
      id: this.calculateBlockId(3, [tx3]),
      height: 3,
      transactions: [tx3]
    };

    const expectedBalances = {
      afterBlock1: { [addr1]: 10 },
      afterBlock2: { [addr1]: 0, [addr2]: 4, [addr3]: 6 },
      afterBlock3: { [addr1]: 0, [addr2]: 4, [addr3]: 0, [addr4]: 2, [addr5]: 2, [addr6]: 2 },
      afterRollbackToHeight2: { [addr1]: 0, [addr2]: 4, [addr3]: 6 }
    };

    return { block1, block2, block3, expectedBalances };
  }

  // Helper method to calculate block ID (same logic as BlockValidator)
  static calculateBlockId(height: number, transactions: Transaction[]): string {
    const transactionIds = transactions.map(tx => tx.id).join('');
    const input = `${height}${transactionIds}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}

// Mock services for testing
export class MockUTXOService {
  private utxos: UTXO[] = [];

  async processTransaction(transaction: Transaction, blockHeight: number): Promise<void> {
    // Mock implementation
    for (const input of transaction.inputs) {
      this.utxos = this.utxos.filter(utxo => 
        !(utxo.txId === input.txId && utxo.outputIndex === input.index)
      );
    }

    for (let i = 0; i < transaction.outputs.length; i++) {
      const output = transaction.outputs[i];
      this.utxos.push({
        txId: transaction.id,
        outputIndex: i,
        address: output.address,
        value: output.value,
        blockHeight
      });
    }
  }

  async getInputValue(input: Input): Promise<number> {
    const utxo = this.utxos.find(u => 
      u.txId === input.txId && u.outputIndex === input.index
    );
    return utxo ? utxo.value : 0;
  }

  async getAddressUTXOs(address: string): Promise<UTXO[]> {
    return this.utxos.filter(utxo => utxo.address === address);
  }

  async validateInputExists(input: Input): Promise<boolean> {
    return this.utxos.some(utxo => 
      utxo.txId === input.txId && utxo.outputIndex === input.index
    );
  }

  // Test helpers
  setUTXOs(utxos: UTXO[]): void {
    this.utxos = [...utxos];
  }

  getUTXOs(): UTXO[] {
    return [...this.utxos];
  }

  clearUTXOs(): void {
    this.utxos = [];
  }
}

export class MockBlocksService {
  private currentHeight = 0;
  private blocks: Block[] = [];

  async getCurrentBlockHeight(): Promise<number> {
    return this.currentHeight;
  }

  async addBlock(block: Block): Promise<Block> {
    this.blocks.push(block);
    this.currentHeight = Math.max(this.currentHeight, block.height);
    return block;
  }

  async getAllBlocks(): Promise<Block[]> {
    return [...this.blocks];
  }

  // Test helpers
  setCurrentHeight(height: number): void {
    this.currentHeight = height;
  }

  setBlocks(blocks: Block[]): void {
    this.blocks = [...blocks];
    this.currentHeight = Math.max(...blocks.map(b => b.height), 0);
  }

  clearBlocks(): void {
    this.blocks = [];
    this.currentHeight = 0;
  }
}

// Helper functions for testing
export function calculateAddressBalance(address: string, utxos: UTXO[]): number {
  return utxos
    .filter(utxo => utxo.address === address)
    .reduce((sum, utxo) => sum + utxo.value, 0);
}

export function expectBalances(utxos: UTXO[], expectedBalances: Record<string, number>): void {
  for (const [address, expectedBalance] of Object.entries(expectedBalances)) {
    const actualBalance = calculateAddressBalance(address, utxos);
    expect(actualBalance).toBe(expectedBalance);
  }
}

// Mock Fastify request and reply objects
export function createMockRequest(params: any = {}, query: any = {}, body: any = {}): any {
  return {
    params,
    query,
    body,
    log: mockLogger
  };
}

export function createMockReply(): any {
  const response = {
    code: 200,
    send: (data: any) => data
  };

  return {
    code: (statusCode: number) => {
      response.code = statusCode;
      return response;
    },
    send: (data: any) => data,
    getStatusCode: () => response.code
  };
}
