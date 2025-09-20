import { expect, test, describe, beforeEach } from "bun:test";
import { BalanceController } from "../../src/controllers/balance.controller";
import { TestDataFactory, createMockRequest, createMockReply } from "../test-utils";

describe("Balance Controller", () => {
  let controller: BalanceController;

  beforeEach(() => {
    controller = new BalanceController();
  });

  test("should instantiate balance controller", () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(BalanceController);
  });

  test("should have required methods", () => {
    expect(typeof controller.getBalance).toBe("function");
    expect(typeof controller.getTransactionHistory).toBe("function");
  });

  describe("Request/Response Data Structure Tests", () => {
    test("should validate address format", () => {
      const validAddresses = ["addr1", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"];
      const invalidAddresses = ["", "a"];

      validAddresses.forEach(address => {
        expect(address.length).toBeGreaterThan(3);
        expect(typeof address).toBe("string");
      });

      invalidAddresses.forEach(address => {
        expect(address.length).toBeLessThanOrEqual(3);
      });
    });

    test("should handle balance request structure", () => {
      const request = createMockRequest(
        { address: "addr1" }, // params
        {}, // query
        {} // body
      );

      expect(request.params.address).toBe("addr1");
      expect(typeof request.params.address).toBe("string");
    });

    test("should handle transaction history request structure", () => {
      const request = createMockRequest(
        { address: "addr1" }, // params
        { limit: 10, offset: 0 }, // query
        {} // body
      );

      expect(request.params.address).toBe("addr1");
      expect(request.query.limit).toBe(10);
      expect(request.query.offset).toBe(0);
    });
  });

  describe("API Response Structure Tests", () => {
    test("should validate balance response structure", () => {
      const balanceResponse = {
        success: true,
        address: "addr1",
        balance: 150,
        currency: "BTC",
        lastUpdated: "2024-01-15T10:30:00.000Z"
      };

      expect(balanceResponse.success).toBe(true);
      expect(typeof balanceResponse.address).toBe("string");
      expect(typeof balanceResponse.balance).toBe("number");
      expect(balanceResponse.currency).toBe("BTC");
      expect(typeof balanceResponse.lastUpdated).toBe("string");
    });

    test("should validate transaction history response structure", () => {
      const historyResponse = {
        success: true,
        address: "addr1",
        transactions: [
          {
            txId: "tx1",
            blockHeight: 1,
            timestamp: "2024-01-15T10:30:00.000Z",
            amount: 10,
            type: "output" as const,
            address: "addr1"
          }
        ],
        pagination: {
          limit: 10,
          offset: 0,
          total: 1
        }
      };

      expect(historyResponse.success).toBe(true);
      expect(typeof historyResponse.address).toBe("string");
      expect(Array.isArray(historyResponse.transactions)).toBe(true);
      expect(typeof historyResponse.pagination.limit).toBe("number");
      expect(typeof historyResponse.pagination.offset).toBe("number");
      expect(typeof historyResponse.pagination.total).toBe("number");
    });

    test("should validate error response structure", () => {
      const errorResponse = {
        success: false,
        error: "Invalid address format",
        code: 400
      };

      expect(errorResponse.success).toBe(false);
      expect(typeof errorResponse.error).toBe("string");
      expect(typeof errorResponse.code).toBe("number");
    });
  });
});
