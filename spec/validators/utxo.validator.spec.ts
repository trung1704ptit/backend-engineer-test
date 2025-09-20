import { expect, test, describe, beforeEach } from "bun:test";
import { UTXOValidator } from "../../src/validators/utxo.validator";
import { TestDataFactory } from "../test-utils";

describe("UTXO Validator", () => {
  describe("validateInputExists", () => {
    test("should validate existing input", async () => {
      const input = TestDataFactory.createInput("tx1", 0);
      const mockGetUTXO = async (txId: string, index: number) => {
        if (txId === "tx1" && index === 0) {
          return TestDataFactory.createUTXO("tx1", 0, "addr1", 10, 1);
        }
        return null;
      };

      const result = await UTXOValidator.validateInputExists(input, mockGetUTXO);
      
      expect(result.isValid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.value).toBe(10);
    });

    test("should reject non-existing input", async () => {
      const input = TestDataFactory.createInput("tx1", 0);
      const mockGetUTXO = async () => null;

      const result = await UTXOValidator.validateInputExists(input, mockGetUTXO);
      
      expect(result.isValid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.error).toContain("non-existent UTXO");
    });
  });

  describe("validateOutput", () => {
    test("should validate valid output", () => {
      const output = TestDataFactory.createOutput("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 10);

      const result = UTXOValidator.validateOutput(output, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject output with empty address", () => {
      const output = TestDataFactory.createOutput("", 10);

      const result = UTXOValidator.validateOutput(output, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Output 0: address must be a valid non-empty string");
    });

    test("should reject output with negative value", () => {
      const output = TestDataFactory.createOutput("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", -10);

      const result = UTXOValidator.validateOutput(output, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Output 0: value cannot be negative");
    });
  });

  describe("validateNoDoubleSpending", () => {
    test("should validate no double spending", () => {
      const inputs = [
        TestDataFactory.createInput("tx1", 0),
        TestDataFactory.createInput("tx2", 0)
      ];

      const result = UTXOValidator.validateNoDoubleSpending(inputs);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should detect double spending", () => {
      const inputs = [
        TestDataFactory.createInput("tx1", 0),
        TestDataFactory.createInput("tx1", 0) // Same input twice
      ];

      const result = UTXOValidator.validateNoDoubleSpending(inputs);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes("Double spending detected"))).toBe(true);
    });
  });
});
