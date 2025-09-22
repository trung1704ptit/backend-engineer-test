import { expect } from "bun:test";
import crypto from 'crypto';
import type { Block, Transaction, Input, Output } from '../src/types/blocks.types';
import type { UTXO } from '../src/services/utxo.service';

export const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
};

// Mock database cleanup utility - no actual database operations
export async function cleanupTestDatabase(): Promise<void> {
  // Mock implementation - no actual database cleanup needed
  // This is just a placeholder for tests that expect this function
  return Promise.resolve();
}

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
    // Parse basic SQL operations for testing
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('select')) {
      return this.handleSelect(sql, params);
    } else if (sqlLower.startsWith('insert')) {
      return this.handleInsert(sql, params);
    } else if (sqlLower.startsWith('delete')) {
      return this.handleDelete(sql, params);
    } else if (sqlLower.startsWith('alter')) {
      // Handle sequence resets
      return { rows: [] };
    }
    
    return { rows: [] };
  }

  private handleSelect(sql: string, params?: any[]): { rows: any[] } {
    // Handle specific queries used in the services
    if (sql.includes('blocks') && sql.includes('order by height')) {
      // getAllBlocks query
      return { rows: this.data.get('blocks') || [] };
    } else if (sql.includes('blocks') && sql.includes('height =')) {
      // getBlockByHeight query
      const height = params?.[0];
      const blocks = this.data.get('blocks') || [];
      const block = blocks.find((b: any) => b.data.height === height);
      return { rows: block ? [block] : [] };
    } else if (sql.includes('blocks') && sql.includes('height >=') && sql.includes('height <=')) {
      // getBlocksToRollback query
      const fromHeight = params?.[0];
      const toHeight = params?.[1];
      const blocks = this.data.get('blocks') || [];
      const filtered = blocks.filter((b: any) => b.data.height >= fromHeight && b.data.height <= toHeight);
      // Return the data property directly for rollback service
      return { rows: filtered.map((b: any) => b.data) };
    } else if (sql.includes('max(height)') || sql.includes('MAX(height)')) {
      // getCurrentBlockHeight query
      const blocks = this.data.get('blocks') || [];
      const maxHeight = blocks.length > 0 ? Math.max(...blocks.map((b: any) => b.data.height)) : 0;
      return { rows: [{ height: maxHeight.toString() }] };
    } else if (sql.includes('utxos') && sql.includes('address =')) {
      // getAddressUTXOs query
      const address = params?.[0];
      const utxos = this.data.get('utxos') || [];
      const filtered = utxos.filter((u: any) => u.address === address);
      return { rows: filtered };
    } else if (sql.includes('utxos') && sql.includes('tx_id =') && sql.includes('output_index =')) {
      // getUTXO query
      const txId = params?.[0];
      const outputIndex = params?.[1];
      const utxos = this.data.get('utxos') || [];
      const utxo = utxos.find((u: any) => u.tx_id === txId && u.output_index === outputIndex);
      return { rows: utxo ? [utxo] : [] };
    } else if (sql.includes('rollback_history') && sql.includes('order by timestamp desc limit 1')) {
      // getLastRollback query
      const history = this.data.get('rollback_history') || [];
      const lastRollback = history.length > 0 ? history[0] : null;
      return { rows: lastRollback ? [lastRollback] : [] };
    } else if (sql.includes('rollback_history') && sql.includes('order by timestamp desc limit')) {
      // getRollbackHistory query
      const limit = params?.[0] || 10;
      const history = this.data.get('rollback_history') || [];
      return { rows: history.slice(0, limit) };
    } else if (sql.includes('blocks') && sql.includes('data @>')) {
      // Complex JSON query for transaction lookup
      const blocks = this.data.get('blocks') || [];
      // For the rollback service, we need to find blocks that contain specific transactions
      // This is a simplified mock - in real implementation, this would be a JSON query
      const searchPattern = sql.match(/\{"transactions":\[{"id":"([^"]+)"}\]\}/);
      if (searchPattern) {
        const txId = searchPattern[1];
        const matchingBlocks = blocks.filter((block: any) => 
          block.data.transactions && block.data.transactions.some((tx: any) => tx.id === txId)
        );
        // Return the data property directly for the restoreUTXO method
        return { rows: matchingBlocks.map((b: any) => ({ data: b.data })) };
      }
      return { rows: blocks.map((b: any) => ({ data: b.data })) };
    }
    
    return { rows: [] };
  }

  private handleInsert(sql: string, params?: any[]): { rows: any[] } {
    if (sql.includes('blocks')) {
      // Insert block
      const [id, height, data] = params || [];
      const blocks = this.data.get('blocks') || [];
      blocks.push({ id, height, data: JSON.parse(data) });
      this.data.set('blocks', blocks);
    } else if (sql.includes('utxos')) {
      // Insert UTXO
      const [tx_id, output_index, address, value, block_height] = params || [];
      const utxos = this.data.get('utxos') || [];
      utxos.push({ tx_id, output_index, address, value, block_height });
      this.data.set('utxos', utxos);
    } else if (sql.includes('rollback_history')) {
      // Insert rollback history
      const [from_height, to_height, blocks_removed, timestamp] = params || [];
      const history = this.data.get('rollback_history') || [];
      history.unshift({ from_height, to_height, blocks_removed, timestamp });
      this.data.set('rollback_history', history);
    }
    return { rows: [] };
  }

  private handleDelete(sql: string, params?: any[]): { rows: any[] } {
    if (sql.includes('utxos') && sql.includes('tx_id =') && sql.includes('output_index =')) {
      // Delete specific UTXO
      const txId = params?.[0];
      const outputIndex = params?.[1];
      const utxos = this.data.get('utxos') || [];
      const filtered = utxos.filter((u: any) => !(u.tx_id === txId && u.output_index === outputIndex));
      this.data.set('utxos', filtered);
    } else if (sql.includes('blocks') && sql.includes('height >=')) {
      // Delete blocks from height
      const fromHeight = params?.[0];
      const blocks = this.data.get('blocks') || [];
      const filtered = blocks.filter((b: any) => b.data.height < fromHeight);
      this.data.set('blocks', filtered);
    } else if (sql.includes('utxos') && sql.includes('block_height >=')) {
      // Delete UTXOs from height
      const fromHeight = params?.[0];
      const utxos = this.data.get('utxos') || [];
      const filtered = utxos.filter((u: any) => u.block_height < fromHeight);
      this.data.set('utxos', filtered);
    } else if (sql.includes('delete from')) {
      // Clear all data from table
      const tableName = sql.match(/delete from (\w+)/i)?.[1];
      if (tableName) {
        this.data.set(tableName, []);
      }
    }
    return { rows: [] };
  }

  async connect(): Promise<void> {
    // Mock connection - always succeeds
  }

  async close(): Promise<void> {
    // Mock close - always succeeds
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

  // Helper methods for test setup
  setBlocks(blocks: any[]): void {
    const blockData = blocks.map(block => ({
      id: block.id,
      height: block.height,
      data: block
    }));
    this.setData('blocks', blockData);
  }

  setUTXOs(utxos: UTXO[]): void {
    const utxoData = utxos.map(utxo => ({
      tx_id: utxo.txId,
      output_index: utxo.outputIndex,
      address: utxo.address,
      value: utxo.value,
      block_height: utxo.blockHeight
    }));
    this.setData('utxos', utxoData);
  }
}

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
    // MOCK addresses
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
