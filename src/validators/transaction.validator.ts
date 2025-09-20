import logger from '../logger';
import type { Transaction, Input, Output } from '../types/blocks.types';

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TransactionBalanceValidationResult {
  isValid: boolean;
  inputSum: number;
  outputSum: number;
  transactionId: string;
  error?: string;
}

export interface TransactionStructureValidationResult {
  isValid: boolean;
  errors: string[];
}

export class TransactionValidator {
  /**
   * Validate transaction structure
   */
  static validateTransactionStructure(transaction: Transaction): TransactionStructureValidationResult {
    const errors: string[] = [];

    // Validate transaction ID
    if (!transaction.id || typeof transaction.id !== 'string' || transaction.id.trim() === '') {
      errors.push('Transaction must have a valid ID');
    }

    // Validate inputs array
    if (!Array.isArray(transaction.inputs)) {
      errors.push('Transaction inputs must be an array');
    }

    // Validate outputs array
    if (!Array.isArray(transaction.outputs)) {
      errors.push('Transaction outputs must be an array');
    }

    // Validate individual inputs
    if (Array.isArray(transaction.inputs)) {
      transaction.inputs.forEach((input, index) => {
        const inputErrors = TransactionValidator.validateInputStructure(input, index);
        errors.push(...inputErrors);
      });
    }

    // Validate individual outputs
    if (Array.isArray(transaction.outputs)) {
      transaction.outputs.forEach((output, index) => {
        const outputErrors = TransactionValidator.validateOutputStructure(output, index);
        errors.push(...outputErrors);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate input structure
   */
  static validateInputStructure(input: Input, index: number): string[] {
    const errors: string[] = [];

    if (!input.txId || typeof input.txId !== 'string' || input.txId.trim() === '') {
      errors.push(`Input ${index}: txId must be a valid string`);
    }

    if (typeof input.index !== 'number' || input.index < 0 || !Number.isInteger(input.index)) {
      errors.push(`Input ${index}: index must be a non-negative integer`);
    }

    return errors;
  }

  /**
   * Validate output structure
   */
  static validateOutputStructure(output: Output, index: number): string[] {
    const errors: string[] = [];

    if (!output.address || typeof output.address !== 'string' || output.address.trim() === '') {
      errors.push(`Output ${index}: address must be a valid string`);
    }

    if (typeof output.value !== 'number' || output.value < 0) {
      errors.push(`Output ${index}: value must be a non-negative number`);
    }

    return errors;
  }

  /**
   * Validate transaction balance (inputs sum = outputs sum)
   */
  static validateTransactionBalance(
    transaction: Transaction,
    inputValues: number[]
  ): TransactionBalanceValidationResult {
    const inputSum = inputValues.reduce((sum, value) => sum + value, 0);
    const outputSum = transaction.outputs.reduce((sum, output) => sum + output.value, 0);

    if (inputSum !== outputSum) {
      const error = `Transaction ${transaction.id} has invalid balance. Inputs: ${inputSum}, Outputs: ${outputSum}`;
      logger.warn('Transaction balance validation failed', { 
        transactionId: transaction.id, 
        inputSum, 
        outputSum 
      });

      return {
        isValid: false,
        inputSum,
        outputSum,
        transactionId: transaction.id,
        error
      };
    }

    return {
      isValid: true,
      inputSum,
      outputSum,
      transactionId: transaction.id
    };
  }

  /**
   * Validate all transactions in a block
   */
  static validateTransactions(
    transactions: Transaction[],
    getInputValue: (input: Input) => Promise<number>
  ): Promise<TransactionValidationResult> {
    return new Promise(async (resolve) => {
      const errors: string[] = [];

      for (const transaction of transactions) {
        // Validate transaction structure
        const structureValidation = TransactionValidator.validateTransactionStructure(transaction);
        if (!structureValidation.isValid) {
          errors.push(...structureValidation.errors);
          continue; // Skip balance validation if structure is invalid
        }

        // Get input values for balance validation
        const inputValues: number[] = [];
        for (const input of transaction.inputs) {
          try {
            const value = await getInputValue(input);
            inputValues.push(value);
          } catch (error) {
            errors.push(`Transaction ${transaction.id}: Failed to get value for input ${input.txId}:${input.index}`);
          }
        }

        // Validate transaction balance (skip coinbase transactions)
        if (transaction.inputs.length === 0) {
          // This is a coinbase transaction - validate it separately
          const coinbaseValidation = TransactionValidator.validateCoinbaseTransaction(transaction);
          if (!coinbaseValidation.isValid) {
            errors.push(...coinbaseValidation.errors);
          }
        } else if (inputValues.length === transaction.inputs.length) {
          // Regular transaction - validate balance
          const balanceValidation = TransactionValidator.validateTransactionBalance(transaction, inputValues);
          if (!balanceValidation.isValid) {
            errors.push(balanceValidation.error!);
          }
        }
      }

      resolve({
        isValid: errors.length === 0,
        errors
      });
    });
  }


  static validateCoinbaseTransaction(transaction: Transaction): TransactionValidationResult {
    const errors: string[] = [];

    // Coinbase transactions should have no inputs
    if (transaction.inputs.length > 0) {
      errors.push('Coinbase transaction should have no inputs');
    }

    // Should have at least one output
    if (transaction.outputs.length === 0) {
      errors.push('Coinbase transaction must have at least one output');
    }

    // Validate structure
    const structureValidation = TransactionValidator.validateTransactionStructure(transaction);
    if (!structureValidation.isValid) {
      errors.push(...structureValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static isCoinbaseTransaction(transaction: Transaction): boolean {
    return transaction.inputs.length === 0;
  }
}
