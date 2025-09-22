import { expect, test, describe, beforeEach } from "bun:test";
import { BlocksService } from "../../src/services/blocks.service";
import { BlockValidator } from "../../src/validators/block.validator";
import { TestDataFactory, MockUTXOService, expectBalances, cleanupTestDatabase } from "../test-utils";
import { mockServiceDatabase } from "../database-mock";

describe("Blocks Service", () => {
  let blocksService: BlocksService;
  let mockUTXOService: MockUTXOService;

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupTestDatabase();
    
    blocksService = new BlocksService();
    mockUTXOService = new MockUTXOService();
    
    // Replace the UTXO service and database connection with mocks
    (blocksService as any).utxoService = mockUTXOService;
    mockServiceDatabase(blocksService);
    
    // Clear the mock database between tests
    const mockDb = (blocksService as any).db;
    mockDb.clearData();
  });

  describe("addBlock", () => {
    test("should add valid block successfully", async () => {
      // Set up initial UTXO for the input
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx0", 0, "addr0", 10, 0)
      ]);

      const transactions = [
        TestDataFactory.createTransaction("tx1", [
          TestDataFactory.createInput("tx0", 0)
        ], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ];
      
      // Calculate proper block ID
      const properBlockId = BlockValidator.calculateBlockId(1, transactions);
      const block = TestDataFactory.createBlock(properBlockId, 1, transactions);

      // Mock getCurrentBlockHeight to return 0 (for first block)
      const originalGetHeight = (blocksService as any).getCurrentBlockHeight;
      (blocksService as any).getCurrentBlockHeight = () => Promise.resolve(0);

      const result = await blocksService.addBlock(block);
      
      expect(result).toEqual(block);
      expect(mockUTXOService.getUTXOs()).toHaveLength(1);
      expect(mockUTXOService.getUTXOs()[0].address).toBe("addr1");
      expect(mockUTXOService.getUTXOs()[0].value).toBe(10);

      // Restore original method
      (blocksService as any).getCurrentBlockHeight = originalGetHeight;
    });

    test("should reject block with invalid height", async () => {
      const block = TestDataFactory.createBlock("valid_hash", 3, []);

      // Mock getCurrentBlockHeight to return 1 (expecting height 2)
      const originalGetHeight = (blocksService as any).getCurrentBlockHeight;
      (blocksService as any).getCurrentBlockHeight = () => Promise.resolve(1);

      await expect(blocksService.addBlock(block)).rejects.toThrow("Invalid block height");

      // Restore original method
      (blocksService as any).getCurrentBlockHeight = originalGetHeight;
    });

    test("should reject block with invalid ID", async () => {
      const block = TestDataFactory.createBlock("invalid_hash", 1, [
        TestDataFactory.createTransaction("tx1", [], [])
      ]);

      // Mock getCurrentBlockHeight to return 0
      const originalGetHeight = (blocksService as any).getCurrentBlockHeight;
      (blocksService as any).getCurrentBlockHeight = () => Promise.resolve(0);

      await expect(blocksService.addBlock(block)).rejects.toThrow("Invalid block ID");

      // Restore original method
      (blocksService as any).getCurrentBlockHeight = originalGetHeight;
    });

    test("should process transaction with inputs and outputs", async () => {
      // Set up initial UTXO
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx0", 0, "addr1", 10, 1)
      ]);

      const transactions = [
        TestDataFactory.createTransaction("tx1", [
          TestDataFactory.createInput("tx0", 0)
        ], [
          TestDataFactory.createOutput("addr2", 4),
          TestDataFactory.createOutput("addr3", 6)
        ])
      ];
      
      // Calculate proper block ID
      const properBlockId = BlockValidator.calculateBlockId(2, transactions);
      const block = TestDataFactory.createBlock(properBlockId, 2, transactions);

      // Mock getCurrentBlockHeight to return 1
      const originalGetHeight = (blocksService as any).getCurrentBlockHeight;
      (blocksService as any).getCurrentBlockHeight = () => Promise.resolve(1);

      await blocksService.addBlock(block);

      const utxos = mockUTXOService.getUTXOs();
      expect(utxos).toHaveLength(2);
      expectBalances(utxos, { "addr2": 4, "addr3": 6 });

      // Restore original method
      (blocksService as any).getCurrentBlockHeight = originalGetHeight;
    });
  });

  describe("getAllBlocks", () => {
    test("should return all blocks", async () => {
      const result = await blocksService.getAllBlocks();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getCurrentBlockHeight", () => {
    test("should return current block height", async () => {
      // Set up some test blocks
      const testBlocks = [
        TestDataFactory.createBlock("block1", 1, []),
        TestDataFactory.createBlock("block2", 2, [])
      ];
      
      // Set the blocks in the mock database
      const mockDb = (blocksService as any).db;
      mockDb.setBlocks(testBlocks);
      
      const height = await blocksService.getCurrentBlockHeight();
      expect(typeof height).toBe("number");
      expect(height).toBe(2);
    });
    
    test("should return 0 when no blocks exist", async () => {
      const height = await blocksService.getCurrentBlockHeight();
      expect(typeof height).toBe("number");
      expect(height).toBe(0);
    });
  });
});
