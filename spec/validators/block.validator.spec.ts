import { expect, test, describe, beforeEach } from "bun:test";
import { BlockValidator } from "../../src/validators/block.validator";
import { TestDataFactory } from "../test-utils";

describe("Block Validator", () => {
  describe("validateBlockHeight", () => {
    test("should validate correct height increment", () => {
      const result = BlockValidator.validateBlockHeight(2, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.currentHeight).toBe(1);
      expect(result.expectedHeight).toBe(2);
      expect(result.actualHeight).toBe(2);
    });

    test("should reject incorrect height increment", () => {
      const result = BlockValidator.validateBlockHeight(3, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid block height");
      expect(result.error).toContain("Expected: 2, Got: 3");
    });

    test("should validate first block (height 1)", () => {
      const result = BlockValidator.validateBlockHeight(1, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.expectedHeight).toBe(1);
    });

    test("should reject height 0", () => {
      const result = BlockValidator.validateBlockHeight(0, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Expected: 1, Got: 0");
    });
  });

  describe("validateBlockId", () => {
    test("should validate correct block ID", () => {
      const block = TestDataFactory.createBlock("expected_hash", 1, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      // Mock the calculateBlockId to return the expected hash
      const originalCalculate = BlockValidator.calculateBlockId;
      BlockValidator.calculateBlockId = () => "expected_hash";

      const result = BlockValidator.validateBlockId(block);
      
      expect(result.isValid).toBe(true);
      expect(result.expectedId).toBe("expected_hash");
      expect(result.actualId).toBe("expected_hash");

      // Restore original method
      BlockValidator.calculateBlockId = originalCalculate;
    });

    test("should reject incorrect block ID", () => {
      const block = TestDataFactory.createBlock("wrong_hash", 1, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      // Mock the calculateBlockId to return a different hash
      const originalCalculate = BlockValidator.calculateBlockId;
      BlockValidator.calculateBlockId = () => "correct_hash";

      const result = BlockValidator.validateBlockId(block);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid block ID");
      expect(result.error).toContain("Expected: correct_hash, Got: wrong_hash");

      // Restore original method
      BlockValidator.calculateBlockId = originalCalculate;
    });
  });

  describe("calculateBlockId", () => {
    test("should calculate consistent hash for same input", () => {
      const transactions = [
        TestDataFactory.createTransaction("tx1", [], [])
      ];
      
      const hash1 = BlockValidator.calculateBlockId(1, transactions);
      const hash2 = BlockValidator.calculateBlockId(1, transactions);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash format
    });

    test("should calculate different hashes for different heights", () => {
      const transactions = [
        TestDataFactory.createTransaction("tx1", [], [])
      ];
      
      const hash1 = BlockValidator.calculateBlockId(1, transactions);
      const hash2 = BlockValidator.calculateBlockId(2, transactions);
      
      expect(hash1).not.toBe(hash2);
    });

    test("should calculate different hashes for different transactions", () => {
      const transactions1 = [TestDataFactory.createTransaction("tx1", [], [])];
      const transactions2 = [TestDataFactory.createTransaction("tx2", [], [])];
      
      const hash1 = BlockValidator.calculateBlockId(1, transactions1);
      const hash2 = BlockValidator.calculateBlockId(1, transactions2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("validateBlock", () => {
    test("should validate complete valid block", () => {
      const block = TestDataFactory.createBlock("valid_hash", 2, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      // Mock calculateBlockId
      const originalCalculate = BlockValidator.calculateBlockId;
      BlockValidator.calculateBlockId = () => "valid_hash";

      const result = BlockValidator.validateBlock(block, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Restore original method
      BlockValidator.calculateBlockId = originalCalculate;
    });

    test("should validate genesis block", () => {
      const block = TestDataFactory.createBlock("genesis_hash", 1, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      const result = BlockValidator.validateGenesisBlock(block);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject genesis block with wrong height", () => {
      const block = TestDataFactory.createBlock("genesis_hash", 2, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      const result = BlockValidator.validateGenesisBlock(block);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Genesis block must have height 1");
    });
  });
});
