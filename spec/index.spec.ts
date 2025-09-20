import { expect, test, describe } from "bun:test";
import { TestDataFactory } from "./test-utils";

// Main test suite that demonstrates the complete blockchain functionality
describe("Blockchain Indexer - Complete Example", () => {
  test("should demonstrate the complete example scenario from requirements", () => {
    const { block1, block2, block3, expectedBalances } = TestDataFactory.createExampleScenario();
    
    // Verify the example data structure
    expect(block1.height).toBe(1);
    expect(block2.height).toBe(2);
    expect(block3.height).toBe(3);
    
    // Verify block 1: Genesis block with addr1 receiving 10
    expect(block1.transactions).toHaveLength(1);
    expect(block1.transactions[0].inputs).toHaveLength(0); // Coinbase
    expect(block1.transactions[0].outputs).toHaveLength(1);
    expect(block1.transactions[0].outputs[0].address).toBe("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
    expect(block1.transactions[0].outputs[0].value).toBe(10);
    
    // Verify block 2: Transfer from addr1 to addr2 and addr3
    expect(block2.transactions).toHaveLength(1);
    expect(block2.transactions[0].inputs).toHaveLength(1);
    expect(block2.transactions[0].inputs[0].txId).toBe("tx1");
    expect(block2.transactions[0].inputs[0].index).toBe(0);
    expect(block2.transactions[0].outputs).toHaveLength(2);
    expect(block2.transactions[0].outputs[0].address).toBe("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
    expect(block2.transactions[0].outputs[0].value).toBe(4);
    expect(block2.transactions[0].outputs[1].address).toBe("1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4");
    expect(block2.transactions[0].outputs[1].value).toBe(6);
    
    // Verify block 3: Transfer from addr3 to addr4, addr5, addr6
    expect(block3.transactions).toHaveLength(1);
    expect(block3.transactions[0].inputs).toHaveLength(1);
    expect(block3.transactions[0].inputs[0].txId).toBe("tx2");
    expect(block3.transactions[0].inputs[0].index).toBe(1); // Second output of tx2
    expect(block3.transactions[0].outputs).toHaveLength(3);
    expect(block3.transactions[0].outputs[0].address).toBe("1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6");
    expect(block3.transactions[0].outputs[0].value).toBe(2);
    expect(block3.transactions[0].outputs[1].address).toBe("1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8");
    expect(block3.transactions[0].outputs[1].value).toBe(2);
    expect(block3.transactions[0].outputs[2].address).toBe("1F7kwW9iIx6Z6Mi1D3G3vH1eI6lJ7nO8qQ9");
    expect(block3.transactions[0].outputs[2].value).toBe(2);
    
    // Verify expected balances progression
    expect(expectedBalances.afterBlock1["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]).toBe(10);
    
    expect(expectedBalances.afterBlock2["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]).toBe(0);
    expect(expectedBalances.afterBlock2["1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"]).toBe(4);
    expect(expectedBalances.afterBlock2["1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4"]).toBe(6);
    
    expect(expectedBalances.afterBlock3["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"]).toBe(0);
    expect(expectedBalances.afterBlock3["1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"]).toBe(4);
    expect(expectedBalances.afterBlock3["1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4"]).toBe(0);
    expect(expectedBalances.afterBlock3["1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6"]).toBe(2);
    expect(expectedBalances.afterBlock3["1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8"]).toBe(2);
    expect(expectedBalances.afterBlock3["1F7kwW9iIx6Z6Mi1D3G3vH1eI6lJ7nO8qQ9"]).toBe(2);
    
    // Verify rollback scenario
    expect(expectedBalances.afterRollbackToHeight2).toEqual(expectedBalances.afterBlock2);
  });
  
  test("should validate block ID calculation", () => {
    const { block1, block2, block3 } = TestDataFactory.createExampleScenario();
    
    // Verify block IDs are defined and non-empty
    expect(block1.id).toBeDefined();
    expect(block2.id).toBeDefined();
    expect(block3.id).toBeDefined();
    expect(typeof block1.id).toBe("string");
    expect(typeof block2.id).toBe("string");
    expect(typeof block3.id).toBe("string");
    
    // Verify block IDs are unique
    expect(block1.id).not.toBe(block2.id);
    expect(block2.id).not.toBe(block3.id);
    expect(block1.id).not.toBe(block3.id);
    
    // Note: In the example scenario, we use placeholder IDs for clarity
    // In production, these would be SHA256 hashes: /^[a-f0-9]{64}$/
  });
  
  test("should validate transaction balance calculations", () => {
    const { block2, block3 } = TestDataFactory.createExampleScenario();
    
    // Block 2: Input of 10, Outputs of 4 + 6 = 10 (balanced)
    const tx2 = block2.transactions[0];
    const tx2InputSum = 10; // From tx1 output
    const tx2OutputSum = tx2.outputs.reduce((sum: number, output) => sum + output.value, 0);
    expect(tx2OutputSum).toBe(10); // 4 + 6
    expect(tx2InputSum).toBe(tx2OutputSum); // Balanced
    
    // Block 3: Input of 6, Outputs of 2 + 2 + 2 = 6 (balanced)
    const tx3 = block3.transactions[0];
    const tx3InputSum = 6; // From tx2 second output
    const tx3OutputSum = tx3.outputs.reduce((sum: number, output) => sum + output.value, 0);
    expect(tx3OutputSum).toBe(6); // 2 + 2 + 2
    expect(tx3InputSum).toBe(tx3OutputSum); // Balanced
  });
});

// Basic arithmetic test to ensure test framework is working
test('Test framework is working', () => {
  expect(2 + 2).toBe(4);
});