## Project Structure

```
backend-engineer-test/
├── 📁 src/                           # Source code
│   ├── 📁 configs/                   # Configuration files
│   │   ├── database.ts              # Database configuration
│   │   └── index.ts                 # Config exports
│   ├── 📁 controllers/              # HTTP request handlers
│   │   ├── balance.controller.ts    # Balance API endpoints
│   │   ├── blocks.controller.ts     # Blocks API endpoints
│   │   ├── rollback.controller.ts   # Rollback API endpoints
│   │   ├── system.controller.ts     # System health endpoints
│   │   └── index.ts                 # Controller exports
│   ├── 📁 database/                 # Database layer
│   │   ├── connection.ts            # Database connection setup
│   │   ├── migrations.ts            # Database schema migrations
│   │   └── index.ts                 # Database exports
│   ├── 📁 logger/                   # Logging utilities
│   │   └── index.ts                 # Pino logger configuration
│   ├── 📁 routes/                   # API route definitions
│   │   ├── balance.route.ts         # Balance routes
│   │   ├── blocks.route.ts          # Blocks routes
│   │   ├── rollback.route.ts        # Rollback routes
│   │   ├── system.route.ts          # System routes
│   │   └── index.ts                 # Route exports
│   ├── 📁 schemas/                  # Request/response schemas
│   │   ├── balance.schema.ts        # Balance validation schemas
│   │   ├── blocks.schema.ts         # Blocks validation schemas
│   │   ├── rollback.schema.ts       # Rollback validation schemas
│   │   ├── system.schema.ts         # System validation schemas
│   │   └── index.ts                 # Schema exports
│   ├── 📁 services/                 # Business logic layer
│   │   ├── balance.service.ts       # Balance calculation logic
│   │   ├── blockchain.service.ts    # Blockchain operations
│   │   ├── blocks.service.ts        # Block management logic
│   │   ├── rollback.service.ts      # Rollback operations
│   │   ├── utxo.service.ts          # UTXO management
│   │   └── index.ts                 # Service exports
│   ├── 📁 types/                    # TypeScript type definitions
│   │   ├── balance.types.ts         # Balance-related types
│   │   ├── blocks.types.ts          # Block-related types
│   │   ├── common.types.ts          # Shared types
│   │   ├── rollback.types.ts        # Rollback-related types
│   │   └── index.ts                 # Type exports
│   ├── 📁 utils/                    # Utility functions
│   │   ├── block-id-calculator.ts   # Block ID calculation logic
│   │   ├── database.ts              # Database utilities
│   │   └── index.ts                 # Utility exports
│   ├── 📁 validators/               # Input validation logic
│   │   ├── block.validator.ts       # Block validation
│   │   ├── rollback.validator.ts    # Rollback validation
│   │   ├── transaction.validator.ts # Transaction validation
│   │   ├── utxo.validator.ts        # UTXO validation
│   │   └── index.ts                 # Validator exports
│   ├── index.ts                     # Application entry point
│   └── readme.md                    # Internal documentation
├── 📁 spec/                         # Test suite
│   ├── 📁 controllers/              # Controller tests
│   │   ├── balance.controller.spec.ts
│   │   ├── blocks.controller.spec.ts
│   │   └── rollback.controller.spec.ts
│   ├── 📁 integration/              # Integration tests
│   │   └── integration.spec.ts      # End-to-end tests
│   ├── 📁 services/                 # Service tests
│   │   ├── balance.service.spec.ts
│   │   ├── blocks.service.spec.ts
│   │   ├── rollback.service.spec.ts
│   │   └── utxo.service.spec.ts
│   ├── 📁 validators/               # Validator tests
│   │   ├── block.validator.spec.ts
│   │   ├── rollback.validator.spec.ts
│   │   ├── transaction.validator.spec.ts
│   │   └── utxo.validator.spec.ts
│   ├── index.spec.ts                # Main test suite
│   └── test-utils.ts                # Test utilities and mocks
├── 📄 package.json                  # Project dependencies and scripts
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 docker-compose.yaml           # Docker compose configuration
├── 📄 Dockerfile                    # Docker image configuration
├── 📄 bun.lockb                     # Bun lockfile
└── 📄 README.md                     # Project documentation
```

## Architecture Overview

### 🏗️ **Layered Architecture**

- **Controllers** → Handle HTTP requests and responses
- **Services** → Contain business logic and orchestration
- **Validators** → Input validation and data sanitization
- **Database** → Data persistence layer
- **Types** → TypeScript type definitions
- **Schemas** → Request/response validation schemas

### **Key Components**

- **Blockchain Indexer**: Tracks UTXO states and address balances
- **Rollback System**: Allows reverting blockchain state to previous heights
- **Validation Layer**: Comprehensive input validation for all operations
- **Database Layer**: PostgreSQL with proper migrations and connection management
- **Testing Suite**: 109 tests covering unit, integration, and end-to-end scenarios

### **Database Schema**

- `blocks` - Stores blockchain blocks with JSON data
- `utxos` - Unspent transaction outputs for balance tracking
- `rollback_history` - Audit trail of rollback operations

### **API Endpoints**

- `POST /blocks` - Add new blocks to the blockchain
- `GET /balance/:address` - Get balance for an address
- `GET /balance/:address/history` - Get transaction history
- `POST /rollback?height=X` - Rollback to specific height
- `GET /rollback/status` - Get rollback status and history
- `GET /health` - System health check


### How to Test
For testing we are setting 
DATABASE_URL=postgres://myuser:mypassword@localhost:5432/mydatabase
if run in localhost: let create .env file and add above variable.

run docker:
```
docker-compose up -d --build
```

#### Add Block 1: Genesis Block (Creates Initial Money)

```
{
    "id": "f64b04994895eb9ea368641eba51fd789dc13124390e83fb65254952814a72f6",
    "height": 1,
    "transactions": [
        {
            "id": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
            "inputs": [],
            "outputs": [
                {
                    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                    "value": 50
                }
            ]
        }
    ]
}
```

#### Transfer from Address 1 to Addresses 2 and 3

```
{
    "id": "3622845b6c3e25054376334150161a2cc2894ca68415b010916af7250de96953",
    "height": 2,
    "transactions": [
        {
            "id": "2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
            "inputs": [
                {
                    "txId": "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
                    "index": 0
                }
            ],
            "outputs": [
                {
                    "address": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
                    "value": 20
                },
                {
                    "address": "1C4hvV6eGx3Y3Jf8A9D0sE8bF1cG2dH3iJ4",
                    "value": 30
                }
            ]
        }
    ]
}
```

```
{
    "id": "3f0b37c35bc3ac9ebde8e5ee19fecdf859bbbd3c1f48af422edf6000371a20a8",
    "height": 3,
    "transactions": [
        {
            "id": "3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
            "inputs": [
                {
                    "txId": "2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
                    "index": 1
                }
            ],
            "outputs": [
                {
                    "address": "1D5iwV7fHx4Y4Kg9B1E1tF9cG3eH4jK5lM6",
                    "value": 10
                },
                {
                    "address": "1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8",
                    "value": 10
                },
                {
                    "address": "1F7kwW9iIx6Z6Mi1D3G3vH1eI6lJ7nO8qQ9",
                    "value": 10
                }
            ]
        }
    ]
}
```


#### Get Balance
http://localhost:3000/balance/1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8

Response:
```
{
    "success": true,
    "address": "1E6jxV8gHx5Y5Lh0C2F2uG0dH5kI6mN7oP8",
    "balance": 10,
    "currency": "BTC",
    "lastUpdated": "2025-09-21T02:33:14.353Z"
}

```


#### Rollback
http://localhost:3000/rollback?height=2

Response:
```
{
    "success": true,
    "message": "Successfully rolled back blockchain to height 2",
    "rollbackInfo": {
        "fromHeight": 3,
        "toHeight": 2,
        "blocksRemoved": 1,
        "timestamp": "2025-09-21T02:31:46.222Z"
    }
}
```

