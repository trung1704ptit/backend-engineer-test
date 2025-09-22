import { expect, test, describe, beforeEach } from "bun:test";
import { RollbackService } from "../../src/services/rollback.service";
import { MockBlocksService, cleanupTestDatabase } from "../test-utils";
import { mockServiceDatabase } from "../database-mock";

describe("Rollback Service", () => {
  let rollbackService: RollbackService;
  let mockBlocksService: MockBlocksService;

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupTestDatabase();
    
    rollbackService = new RollbackService();
    mockBlocksService = new MockBlocksService();
    
    // Replace the blocks service and database connection with mocks
    (rollbackService as any).blocksService = mockBlocksService;
    mockServiceDatabase(rollbackService);
    
    // Clear the mock database between tests
    const mockDb = (rollbackService as any).db;
    mockDb.clearData();
  });

  describe("rollbackToHeight", () => {
    test("should perform successful rollback", async () => {
      mockBlocksService.setCurrentHeight(10);
      
      // Set up test blocks in the mock database
      const mockDb = (rollbackService as any).db;
      const testBlocks = [
        { id: "block1", height: 1, data: { id: "block1", height: 1, transactions: [{ id: "tx1", inputs: [], outputs: [{ address: "addr1", value: 10 }] }] } },
        { id: "block2", height: 2, data: { id: "block2", height: 2, transactions: [{ id: "tx2", inputs: [{ txId: "tx1", index: 0 }], outputs: [{ address: "addr2", value: 10 }] }] } }
      ];
      mockDb.setBlocks(testBlocks);

      const result = await rollbackService.rollbackToHeight(5);
      
      expect(result.fromHeight).toBe(10);
      expect(result.toHeight).toBe(5);
      expect(result.blocksRemoved).toBe(5);
      expect(result.timestamp).toBeDefined();
    });

    test("should reject rollback to current height", async () => {
      mockBlocksService.setCurrentHeight(10);

      await expect(rollbackService.rollbackToHeight(10))
        .rejects.toThrow("Cannot rollback to current or future height");
    });

    test("should reject rollback to future height", async () => {
      mockBlocksService.setCurrentHeight(10);

      await expect(rollbackService.rollbackToHeight(15))
        .rejects.toThrow("Cannot rollback to current or future height");
    });

    test("should accept large rollback without confirmation", async () => {
      mockBlocksService.setCurrentHeight(20);

      const result = await rollbackService.rollbackToHeight(5);
      
      expect(result.fromHeight).toBe(20);
      expect(result.toHeight).toBe(5);
      expect(result.blocksRemoved).toBe(15);
    });

    test("should reject rollback exceeding 2000 blocks", async () => {
      mockBlocksService.setCurrentHeight(2500);

      await expect(rollbackService.rollbackToHeight(1))
        .rejects.toThrow("Rollback operation exceeds maximum allowed depth (2000 blocks)");
    });

    test("should allow rollback to height 0", async () => {
      mockBlocksService.setCurrentHeight(5);
      
      // Set up test blocks in the mock database
      const mockDb = (rollbackService as any).db;
      const testBlocks = [
        { id: "block1", height: 1, data: { id: "block1", height: 1, transactions: [{ id: "tx1", inputs: [], outputs: [{ address: "addr1", value: 10 }] }] } }
      ];
      mockDb.setBlocks(testBlocks);

      const result = await rollbackService.rollbackToHeight(0);
      
      expect(result.fromHeight).toBe(5);
      expect(result.toHeight).toBe(0);
      expect(result.blocksRemoved).toBe(5);
    });
  });

  describe("getRollbackStatus", () => {
    test("should return rollback status", async () => {
      mockBlocksService.setCurrentHeight(10);

      const result = await rollbackService.getRollbackStatus();
      
      expect(result.currentHeight).toBe(10);
      expect(result.lastRollback).toBeNull();
      expect(Array.isArray(result.rollbackHistory)).toBe(true);
    });
  });

  describe("validateRollbackRequest", () => {
    test("should validate valid rollback request", async () => {
      mockBlocksService.setCurrentHeight(10);

      const result = await rollbackService.validateRollbackRequest(5);
      
      expect(result.isValid).toBe(true);
      expect(result.currentHeight).toBe(10);
      expect(result.requiresConfirmation).toBe(false);
    });

    test("should reject invalid rollback request", async () => {
      mockBlocksService.setCurrentHeight(10);

      const result = await rollbackService.validateRollbackRequest(15);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Cannot rollback to current or future height");
    });
  });
});
