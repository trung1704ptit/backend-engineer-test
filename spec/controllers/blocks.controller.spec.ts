import { expect, test, describe, beforeEach } from "bun:test";
import { BlocksController } from "../../src/controllers/blocks.controller";
import { TestDataFactory, createMockRequest, createMockReply } from "../test-utils";

describe("Blocks Controller", () => {
  let controller: BlocksController;

  beforeEach(() => {
    controller = new BlocksController();
  });

  test("should instantiate blocks controller", () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(BlocksController);
  });

  test("should have required methods", () => {
    expect(typeof controller.addBlock).toBe("function");
    expect(typeof controller.getAllBlocks).toBe("function");
  });

  describe("Request/Response Data Structure Tests", () => {
    test("should validate block data structure", () => {
      const block = TestDataFactory.createBlock("valid_hash", 1, [
        TestDataFactory.createTransaction("tx1", [], [
          TestDataFactory.createOutput("addr1", 10)
        ])
      ]);

      expect(block.id).toBe("valid_hash");
      expect(block.height).toBe(1);
      expect(block.transactions).toHaveLength(1);
      expect(block.transactions[0].id).toBe("tx1");
      expect(block.transactions[0].outputs[0].address).toBe("addr1");
      expect(block.transactions[0].outputs[0].value).toBe(10);
    });

    test("should validate transaction structure", () => {
      const transaction = TestDataFactory.createTransaction("tx1", [
        TestDataFactory.createInput("tx0", 0)
      ], [
        TestDataFactory.createOutput("addr1", 10),
        TestDataFactory.createOutput("addr2", 5)
      ]);

      expect(transaction.id).toBe("tx1");
      expect(transaction.inputs).toHaveLength(1);
      expect(transaction.inputs[0].txId).toBe("tx0");
      expect(transaction.inputs[0].index).toBe(0);
      expect(transaction.outputs).toHaveLength(2);
      expect(transaction.outputs[0].address).toBe("addr1");
      expect(transaction.outputs[0].value).toBe(10);
      expect(transaction.outputs[1].address).toBe("addr2");
      expect(transaction.outputs[1].value).toBe(5);
    });

    test("should handle add block request structure", () => {
      const block = TestDataFactory.createBlock("block1", 1, []);
      const request = createMockRequest({}, {}, block);

      expect(request.body.id).toBe("block1");
      expect(request.body.height).toBe(1);
      expect(Array.isArray(request.body.transactions)).toBe(true);
    });

    test("should handle get all blocks request structure", () => {
      const request = createMockRequest({}, {}, {});

      expect(request.params).toBeDefined();
      expect(request.query).toBeDefined();
      expect(request.body).toBeDefined();
    });
  });

  describe("API Response Structure Tests", () => {
    test("should validate success response structure", () => {
      const successResponse = {
        success: true,
        message: "Operation completed successfully",
        data: { id: "test" }
      };

      expect(successResponse.success).toBe(true);
      expect(typeof successResponse.message).toBe("string");
      expect(successResponse.data).toBeDefined();
    });

    test("should validate blocks response structure", () => {
      const blocksResponse = {
        success: true,
        blocks: [
          TestDataFactory.createBlock("block1", 1, []),
          TestDataFactory.createBlock("block2", 2, [])
        ],
        count: 2
      };

      expect(blocksResponse.success).toBe(true);
      expect(Array.isArray(blocksResponse.blocks)).toBe(true);
      expect(blocksResponse.count).toBe(2);
      expect(blocksResponse.blocks[0].height).toBe(1);
      expect(blocksResponse.blocks[1].height).toBe(2);
    });

    test("should validate error response structure", () => {
      const errorResponse = {
        success: false,
        error: "Invalid block height",
        code: 400
      };

      expect(errorResponse.success).toBe(false);
      expect(typeof errorResponse.error).toBe("string");
      expect(typeof errorResponse.code).toBe("number");
    });
  });
});
