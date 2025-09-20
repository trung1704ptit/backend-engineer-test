import { expect, test, describe, beforeEach } from "bun:test";
import { MockUTXOService, TestDataFactory } from "../test-utils";

describe("UTXO Service Integration", () => {
  let mockUTXOService: MockUTXOService;

  beforeEach(() => {
    mockUTXOService = new MockUTXOService();
  });

  describe("processTransaction", () => {
    test("should process coinbase transaction", async () => {
      const transaction = TestDataFactory.createTransaction("tx1", [], [
        TestDataFactory.createOutput("addr1", 10)
      ]);

      await mockUTXOService.processTransaction(transaction, 1);

      const utxos = mockUTXOService.getUTXOs();
      expect(utxos).toHaveLength(1);
      expect(utxos[0].address).toBe("addr1");
      expect(utxos[0].value).toBe(10);
    });

    test("should process transaction with inputs and outputs", async () => {
      // Set up initial UTXO
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx0", 0, "addr1", 10, 1)
      ]);

      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr2", 4),
        TestDataFactory.createOutput("addr3", 6)
      ]);

      await mockUTXOService.processTransaction(transaction, 2);

      const utxos = mockUTXOService.getUTXOs();
      expect(utxos).toHaveLength(2);
      expect(utxos.some(utxo => utxo.address === "addr2" && utxo.value === 4)).toBe(true);
      expect(utxos.some(utxo => utxo.address === "addr3" && utxo.value === 6)).toBe(true);
    });

    test("should handle multiple transactions", async () => {
      // Process first transaction
      const tx1 = TestDataFactory.createTransaction("tx1", [], [
        TestDataFactory.createOutput("addr1", 10)
      ]);
      await mockUTXOService.processTransaction(tx1, 1);

      // Process second transaction
      const tx2 = TestDataFactory.createTransaction("tx2", [
        TestDataFactory.createInput("tx1", 0)
      ], [
        TestDataFactory.createOutput("addr2", 5),
        TestDataFactory.createOutput("addr3", 5)
      ]);
      await mockUTXOService.processTransaction(tx2, 2);

      const utxos = mockUTXOService.getUTXOs();
      expect(utxos).toHaveLength(2);
      expect(utxos.some(utxo => utxo.address === "addr2" && utxo.value === 5)).toBe(true);
      expect(utxos.some(utxo => utxo.address === "addr3" && utxo.value === 5)).toBe(true);
    });
  });

  describe("getAddressUTXOs", () => {
    test("should return UTXOs for specific address", async () => {
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx1", 0, "addr1", 10, 1),
        TestDataFactory.createUTXO("tx2", 0, "addr2", 5, 2),
        TestDataFactory.createUTXO("tx3", 0, "addr1", 3, 3)
      ]);

      const utxos = await mockUTXOService.getAddressUTXOs("addr1");
      
      expect(utxos).toHaveLength(2);
      expect(utxos.every(utxo => utxo.address === "addr1")).toBe(true);
      expect(utxos.reduce((sum, utxo) => sum + utxo.value, 0)).toBe(13);
    });

    test("should return empty array for address without UTXOs", async () => {
      const utxos = await mockUTXOService.getAddressUTXOs("nonexistent");
      
      expect(utxos).toHaveLength(0);
    });
  });

  describe("getInputValue", () => {
    test("should return input value for existing UTXO", async () => {
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx1", 0, "addr1", 10, 1)
      ]);

      const input = TestDataFactory.createInput("tx1", 0);
      const value = await mockUTXOService.getInputValue(input);
      
      expect(value).toBe(10);
    });

    test("should return 0 for non-existing UTXO", async () => {
      const input = TestDataFactory.createInput("nonexistent", 0);
      const value = await mockUTXOService.getInputValue(input);
      
      expect(value).toBe(0);
    });
  });

  describe("validateInputExists", () => {
    test("should validate existing input", async () => {
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx1", 0, "addr1", 10, 1)
      ]);

      const input = TestDataFactory.createInput("tx1", 0);
      const exists = await mockUTXOService.validateInputExists(input);
      
      expect(exists).toBe(true);
    });

    test("should reject non-existing input", async () => {
      const input = TestDataFactory.createInput("nonexistent", 0);
      const exists = await mockUTXOService.validateInputExists(input);
      
      expect(exists).toBe(false);
    });
  });
});
