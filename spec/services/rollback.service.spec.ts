import { expect, test, describe, beforeEach } from "bun:test";
import { RollbackService } from "../../src/services/rollback.service";
import { MockBlocksService } from "../test-utils";

describe("Rollback Service", () => {
  let rollbackService: RollbackService;
  let mockBlocksService: MockBlocksService;

  beforeEach(() => {
    rollbackService = new RollbackService();
    mockBlocksService = new MockBlocksService();
    
    // Replace the blocks service with mock
    (rollbackService as any).blocksService = mockBlocksService;
  });

  describe("rollbackToHeight", () => {
    test("should perform successful rollback", async () => {
      mockBlocksService.setCurrentHeight(10);

      const result = await rollbackService.rollbackToHeight(5, false);
      
      expect(result.fromHeight).toBe(10);
      expect(result.toHeight).toBe(5);
      expect(result.blocksRemoved).toBe(5);
      expect(result.timestamp).toBeDefined();
    });

    test("should reject rollback to current height", async () => {
      mockBlocksService.setCurrentHeight(10);

      await expect(rollbackService.rollbackToHeight(10, false))
        .rejects.toThrow("Cannot rollback to current or future height");
    });

    test("should reject rollback to future height", async () => {
      mockBlocksService.setCurrentHeight(10);

      await expect(rollbackService.rollbackToHeight(15, false))
        .rejects.toThrow("Cannot rollback to current or future height");
    });

    test("should require confirmation for large rollback", async () => {
      mockBlocksService.setCurrentHeight(20);

      await expect(rollbackService.rollbackToHeight(5, false))
        .rejects.toThrow("requires confirmation");
    });

    test("should accept large rollback with confirmation", async () => {
      mockBlocksService.setCurrentHeight(20);

      const result = await rollbackService.rollbackToHeight(5, true);
      
      expect(result.fromHeight).toBe(20);
      expect(result.toHeight).toBe(5);
      expect(result.blocksRemoved).toBe(15);
    });

    test("should reject rollback exceeding 2000 blocks", async () => {
      mockBlocksService.setCurrentHeight(2500);

      await expect(rollbackService.rollbackToHeight(1, true))
        .rejects.toThrow("Rollback operation exceeds maximum allowed depth (2000 blocks)");
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
