# Blockchain Indexer Implementation

## Overview

This implementation provides a blockchain indexer that tracks balances for each address using the UTXO (Unspent Transaction Output) model. The system validates blocks according to the specified requirements and maintains an index of address balances.

## API Endpoints

### POST /blocks

Accepts a Block object with the following structure:

```typescript
interface Block {
  id: string;           // SHA256 hash of height + all transaction IDs
  height: number;       // Block height (must be exactly currentHeight + 1)
  transactions: Array<Transaction>;
}

interface Transaction {
  id: string;
  inputs: Array<Input>;
  outputs: Array<Output>;
}

interface Input {
  txId: string;         // Reference to previous transaction
  index: number;        // Output index in that transaction
}

interface Output {
  address: string;      // Recipient address
  value: number;        // Amount received
}
```

### GET /balance/:address

Returns the current balance for a specific address.

## Validation Rules

1. **Block Height Validation**: The block height must be exactly one unit higher than the current blockchain height.
2. **Balance Validation**: For each transaction, the sum of input values must equal the sum of output values.
3. **Block ID Validation**: The block ID must be the SHA256 hash of `height + transaction1.id + transaction2.id + ... + transactionN.id`.

## Example Usage

### Adding the First Block (Genesis Block)

```json
POST /blocks
{
  "id": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "height": 1,
  "transactions": [
    {
      "id": "tx1",
      "inputs": [],
      "outputs": [
        {
          "address": "address1",
          "value": 100
        }
      ]
    }
  ]
}
```

### Adding a Transfer Transaction

```json
POST /blocks
{
  "id": "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
  "height": 2,
  "transactions": [
    {
      "id": "tx2",
      "inputs": [
        {
          "txId": "tx1",
          "index": 0
        }
      ],
      "outputs": [
        {
          "address": "address2",
          "value": 50
        },
        {
          "address": "address1",
          "value": 50
        }
      ]
    }
  ]
}
```

## Balance Calculation

The balance of an address is calculated by summing all unspent outputs (UTXOs) associated with that address:

- When a transaction is processed, its inputs remove UTXOs from the UTXO set
- When a transaction is processed, its outputs add new UTXOs to the UTXO set
- An address's balance is the sum of all UTXOs where the address is the recipient

## Error Handling

The API returns appropriate HTTP status codes:

- `201`: Block added successfully
- `400`: Validation error (invalid height, balance mismatch, or invalid block ID)
- `500`: Internal server error

Error responses include descriptive messages explaining the validation failure.
