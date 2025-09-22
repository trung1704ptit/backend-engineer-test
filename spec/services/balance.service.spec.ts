import { expect, test, describe, beforeEach } from "bun:test";
import { BalanceService } from "../../src/services/balance.service";
import { TestDataFactory, MockUTXOService } from "../test-utils";
import { mockServiceDatabase } from "../database-mock";

describe("Balance Service", () => {
  let balanceService: BalanceService;
  let mockUTXOService: MockUTXOService;

  beforeEach(() => {
    balanceService = new BalanceService();
    mockUTXOService = new MockUTXOService();
    
    // Replace the UTXO service and database connection with mocks
    (balanceService as any).utxoService = mockUTXOService;
    mockServiceDatabase(balanceService);
    
    // Clear the mock database between tests
    const mockDb = (balanceService as any).db;
    mockDb.clearData();
  });

  describe("getBalance", () => {
    test("should return balance for address with UTXOs", async () => {
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx1", 0, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 10, 1),
        TestDataFactory.createUTXO("tx2", 0, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 5, 2)
      ]);

      const result = await balanceService.getBalance("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
      
      expect(result.address).toBe("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
      expect(result.balance).toBe(15);
      expect(result.currency).toBe("BTC");
      expect(result.lastUpdated).toBeDefined();
    });

    test("should return zero balance for address without UTXOs", async () => {
      const result = await balanceService.getBalance("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
      
      expect(result.address).toBe("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
      expect(result.balance).toBe(0);
    });

    test("should reject invalid address format", async () => {
      await expect(balanceService.getBalance("short")).rejects.toThrow("Invalid address format");
    });

    test("should handle empty address", async () => {
      await expect(balanceService.getBalance("")).rejects.toThrow("Invalid address format");
    });
  });

  describe("getTransactionHistory", () => {
    test("should return transaction history", async () => {
      const result = await balanceService.getTransactionHistory("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 10, 0);
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("UTXO Integration", () => {
    test("should calculate correct balances for multiple addresses", async () => {
      // Set up complex UTXO state
      mockUTXOService.setUTXOs([
        TestDataFactory.createUTXO("tx1", 0, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 10, 1),
        TestDataFactory.createUTXO("tx1", 1, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 5, 1),
        TestDataFactory.createUTXO("tx2", 0, "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2", 20, 2),
        TestDataFactory.createUTXO("tx3", 0, "1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4", 15, 3)
      ]);

      // Test balance retrieval
      const balance1 = await balanceService.getBalance("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
      const balance2 = await balanceService.getBalance("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
      const balance3 = await balanceService.getBalance("1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4");
      const balance4 = await balanceService.getBalance("1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6");

      expect(balance1.balance).toBe(15); // 10 + 5
      expect(balance2.balance).toBe(20);
      expect(balance3.balance).toBe(15);
      expect(balance4.balance).toBe(0); // No UTXOs
    });

    test("should handle address validation", async () => {
      await expect(balanceService.getBalance("")).rejects.toThrow("Invalid address format");
      await expect(balanceService.getBalance("short")).rejects.toThrow("Invalid address format");
    });
  });
});
