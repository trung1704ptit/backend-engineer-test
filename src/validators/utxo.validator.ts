import logger from '../logger';
import type { Input, Output } from '../types/blocks.types';
import type { UTXO } from '../services/utxo.service';

export interface UTXOValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InputValidationResult {
  isValid: boolean;
  exists: boolean;
  value: number;
  error?: string;
}

export interface OutputValidationResult {
  isValid: boolean;
  errors: string[];
}

export class UTXOValidator {
  static async validateInputExists(
    input: Input,
    getUTXO: (txId: string, outputIndex: number) => Promise<UTXO | null>
  ): Promise<InputValidationResult> {
    try {
      const utxo = await getUTXO(input.txId, input.index);
      
      if (!utxo) {
        const error = `Input references non-existent UTXO: ${input.txId}:${input.index}`;
        logger.warn('UTXO validation failed - input does not exist', { 
          txId: input.txId, 
          index: input.index 
        });
        
        return {
          isValid: false,
          exists: false,
          value: 0,
          error
        };
      }

      return {
        isValid: true,
        exists: true,
        value: utxo.value
      };
    } catch (error) {
      const errorMessage = `Failed to validate input ${input.txId}:${input.index}`;
      logger.error('UTXO validation error', { txId: input.txId, index: input.index }, error as Error);
      
      return {
        isValid: false,
        exists: false,
        value: 0,
        error: errorMessage
      };
    }
  }

  static validateOutput(output: Output, index: number): OutputValidationResult {
    const errors: string[] = [];

    // Validate address
    if (!output.address || typeof output.address !== 'string' || output.address.trim() === '') {
      errors.push(`Output ${index}: address must be a valid non-empty string`);
    }

    // Validate value
    if (typeof output.value !== 'number') {
      errors.push(`Output ${index}: value must be a number`);
    } else if (output.value < 0) {
      errors.push(`Output ${index}: value cannot be negative`);
    } else if (!isFinite(output.value)) {
      errors.push(`Output ${index}: value must be a finite number`);
    }

    // Validate address format (basic validation)
    if (output.address && typeof output.address === 'string') {
      if (output.address.length < 10) {
        errors.push(`Output ${index}: address appears to be too short`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateOutputs(outputs: Output[]): OutputValidationResult {
    const errors: string[] = [];

    outputs.forEach((output, index) => {
      const validation = UTXOValidator.validateOutput(output, index);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUTXOStructure(utxo: UTXO): UTXOValidationResult {
    const errors: string[] = [];

    // Validate txId
    if (!utxo.txId || typeof utxo.txId !== 'string' || utxo.txId.trim() === '') {
      errors.push('UTXO txId must be a valid non-empty string');
    }

    // Validate outputIndex
    if (typeof utxo.outputIndex !== 'number' || utxo.outputIndex < 0 || !Number.isInteger(utxo.outputIndex)) {
      errors.push('UTXO outputIndex must be a non-negative integer');
    }

    // Validate address
    if (!utxo.address || typeof utxo.address !== 'string' || utxo.address.trim() === '') {
      errors.push('UTXO address must be a valid non-empty string');
    }

    // Validate value
    if (typeof utxo.value !== 'number' || utxo.value < 0 || !isFinite(utxo.value)) {
      errors.push('UTXO value must be a non-negative finite number');
    }

    // Validate blockHeight
    if (typeof utxo.blockHeight !== 'number' || utxo.blockHeight < 1 || !Number.isInteger(utxo.blockHeight)) {
      errors.push('UTXO blockHeight must be a positive integer');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for double spending in a transaction
   */
  static validateNoDoubleSpending(inputs: Input[]): UTXOValidationResult {
    const errors: string[] = [];
    const seenInputs = new Set<string>();

    for (const input of inputs) {
      const inputKey = `${input.txId}:${input.index}`;
      
      if (seenInputs.has(inputKey)) {
        errors.push(`Double spending detected: input ${inputKey} is referenced multiple times`);
      }
      
      seenInputs.add(inputKey);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that all inputs in a transaction exist and are spendable
   */
  static async validateInputsExist(
    inputs: Input[],
    getUTXO: (txId: string, outputIndex: number) => Promise<UTXO | null>
  ): Promise<UTXOValidationResult> {
    const errors: string[] = [];

    // Check for double spending first
    const doubleSpendingValidation = UTXOValidator.validateNoDoubleSpending(inputs);
    if (!doubleSpendingValidation.isValid) {
      errors.push(...doubleSpendingValidation.errors);
    }

    // Check each input exists
    for (const input of inputs) {
      const inputValidation = await UTXOValidator.validateInputExists(input, getUTXO);
      if (!inputValidation.isValid) {
        errors.push(inputValidation.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate address format (basic validation)
   */
  static validateAddressFormat(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    return address.trim().length >= 10;
  }

  static validateValue(value: number): boolean {
    return typeof value === 'number' && 
           value >= 0 && 
           isFinite(value) && 
           value <= Number.MAX_SAFE_INTEGER;
  }
}
