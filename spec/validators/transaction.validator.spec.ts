import { expect, test, describe, beforeEach } from "bun:test";
import { TransactionValidator } from "../../src/validators/transaction.validator";
import { TestDataFactory } from "../test-utils";

describe("Transaction Validator", () => {
  describe("validateTransactionStructure", () => {
    test("should validate valid transaction", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr1", 10)
      ]);

      const result = TransactionValidator.validateTransactionStructure(transaction);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject transaction without ID", () => {
      const transaction = TestDataFactory.createTransaction("", [], []);

      const result = TransactionValidator.validateTransactionStructure(transaction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Transaction must have a valid ID");
    });

    test("should reject transaction with invalid inputs", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        { txId: "", index: 0 } // Invalid input
      ], []);

      const result = TransactionValidator.validateTransactionStructure(transaction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes("txId must be a valid string"))).toBe(true);
    });

    test("should reject transaction with invalid outputs", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [], [
        { address: "", value: 10 } // Invalid output
      ]);

      const result = TransactionValidator.validateTransactionStructure(transaction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes("address must be a valid string"))).toBe(true);
    });
  });

  describe("validateTransactionBalance", () => {
    test("should validate balanced transaction", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr1", 10)
      ]);

      const inputValues = [10]; // Input value equals output value

      const result = TransactionValidator.validateTransactionBalance(transaction, inputValues);
      
      expect(result.isValid).toBe(true);
      expect(result.inputSum).toBe(10);
      expect(result.outputSum).toBe(10);
    });

    test("should reject unbalanced transaction", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr1", 15)
      ]);

      const inputValues = [10]; // Input value less than output value

      const result = TransactionValidator.validateTransactionBalance(transaction, inputValues);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("invalid balance");
      expect(result.error).toContain("Inputs: 10, Outputs: 15");
    });

    test("should validate coinbase transaction", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [], [
        TestDataFactory.createOutput("addr1", 10)
      ]);

      const result = TransactionValidator.validateCoinbaseTransaction(transaction);
      
      expect(result.isValid).toBe(true);
    });

    test("should reject coinbase transaction with inputs", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr1", 10)
      ]);

      const result = TransactionValidator.validateCoinbaseTransaction(transaction);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Coinbase transaction should have no inputs");
    });
  });
});
