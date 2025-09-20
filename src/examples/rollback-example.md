# Rollback API Implementation

## Overview

The POST /rollback endpoint allows you to rollback the blockchain state to a specific height, undoing all transactions that were added after that height and recalculating address balances.

## API Endpoint

### POST /rollback?height=number

Rollback the blockchain state to the specified height.

**Parameters:**
- `height` (required): The target height to rollback to
- `confirm` (optional): Confirmation flag for large rollback operations

**Constraints:**
- Maximum rollback depth: 2000 blocks
- Cannot rollback to current or future height
- Large rollbacks (>10 blocks) require confirmation

## Example Scenario

Let's trace through the example provided in the requirements:

### Initial State (Height 1)
```json
POST /blocks
{
  "id": "hash_of_1_tx1",
  "height": 1,
  "transactions": [{
    "id": "tx1",
    "inputs": [],
    "outputs": [{
      "address": "addr1",
      "value": 10
    }]
  }]
}
```

**Result:** `addr1` has balance of 10

### Transaction 2 (Height 2)
```json
POST /blocks
{
  "id": "hash_of_2_tx2",
  "height": 2,
  "transactions": [{
    "id": "tx2",
    "inputs": [{
      "txId": "tx1",
      "index": 0
    }],
    "outputs": [{
      "address": "addr2",
      "value": 4
    }, {
      "address": "addr3",
      "value": 6
    }]
  }]
}
```

**Result:** 
- `addr1`: 0 (spent its 10)
- `addr2`: 4 (received)
- `addr3`: 6 (received)

### Transaction 3 (Height 3)
```json
POST /blocks
{
  "id": "hash_of_3_tx3",
  "height": 3,
  "transactions": [{
    "id": "tx3",
    "inputs": [{
      "txId": "tx2",
      "index": 1
    }],
    "outputs": [{
      "address": "addr4",
      "value": 2
    }, {
      "address": "addr5",
      "value": 2
    }, {
      "address": "addr6",
      "value": 2
    }]
  }]
}
```

**Result:**
- `addr1`: 0
- `addr2`: 4 (unchanged)
- `addr3`: 0 (spent its 6)
- `addr4`: 2 (received)
- `addr5`: 2 (received)
- `addr6`: 2 (received)

### Rollback to Height 2
```bash
POST /rollback?height=2
```

**Rollback Process:**
1. **Identify blocks to rollback:** Height 3 (tx3)
2. **Undo transaction tx3:**
   - Remove outputs: `addr4`, `addr5`, `addr6` lose their 2 each
   - Restore input: `addr3` gets back its 6 (from tx2 output index 1)
3. **Remove block 3 from storage**
4. **Update blockchain state to height 2**

**Final Result:**
- `addr1`: 0
- `addr2`: 4
- `addr3`: 6

## Rollback Algorithm

### 1. Validation
- Check if target height is valid (< current height)
- Ensure rollback depth ≤ 2000 blocks
- Verify confirmation for large rollbacks

### 2. Block Retrieval
- Get all blocks from `targetHeight + 1` to `currentHeight`
- Process blocks in reverse order (newest first)

### 3. Transaction Undo
For each transaction in reverse order:
- **Remove outputs:** Delete UTXOs created by transaction outputs
- **Restore inputs:** Recreate UTXOs that were spent by transaction inputs

### 4. State Update
- Remove rolled-back blocks from storage
- Update blockchain height to target height
- Save rollback operation to history

## UTXO Rollback Logic

The rollback process reverses UTXO operations:

### Normal Transaction Processing
```
Input:  Spend UTXO (remove from UTXO set)
Output: Create UTXO (add to UTXO set)
```

### Rollback Transaction Processing
```
Input:  Restore UTXO (add back to UTXO set)
Output: Remove UTXO (remove from UTXO set)
```

## API Responses

### Success Response (200)
```json
{
  "success": true,
  "message": "Successfully rolled back blockchain to height 2",
  "rollbackInfo": {
    "fromHeight": 3,
    "toHeight": 2,
    "blocksRemoved": 1,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 - Invalid Rollback
```json
{
  "success": false,
  "error": "Cannot rollback to current or future height"
}
```

#### 400 - Exceeds Maximum Depth
```json
{
  "success": false,
  "error": "Rollback operation exceeds maximum allowed depth (2000 blocks)"
}
```

#### 409 - Confirmation Required
```json
{
  "success": false,
  "error": "This rollback operation requires confirmation",
  "requiresConfirmation": true
}
```

## Usage Examples

### Basic Rollback
```bash
curl -X POST "http://localhost:3000/rollback?height=2"
```

### Rollback with Confirmation
```bash
curl -X POST "http://localhost:3000/rollback?height=100&confirm=true"
```

### Check Rollback Status
```bash
curl -X GET "http://localhost:3000/rollback/status"
```

## Safety Features

1. **Maximum Depth Limit:** Prevents rollbacks beyond 2000 blocks
2. **Confirmation Required:** Large rollbacks require explicit confirmation
3. **Atomic Operations:** Rollback either succeeds completely or fails completely
4. **Comprehensive Logging:** All rollback operations are logged for audit
5. **History Tracking:** Rollback operations are saved to history

## Implementation Notes

The current implementation includes:
- ✅ Validation for rollback parameters
- ✅ UTXO rollback logic (transaction reversal)
- ✅ Block removal and state update
- ✅ Comprehensive error handling
- ✅ Logging and audit trail
- ✅ Maximum depth enforcement (2000 blocks)

Database integration points are marked with TODO comments and would need to be implemented with actual database operations for a production system.
