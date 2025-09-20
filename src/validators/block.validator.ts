import logger from '../logger';
import crypto from 'crypto';
import type { Block, Transaction } from '../types/blocks.types';

export interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BlockHeightValidationResult {
  isValid: boolean;
  currentHeight: number;
  expectedHeight: number;
  actualHeight: number;
  error?: string;
}

export interface BlockIdValidationResult {
  isValid: boolean;
  expectedId: string;
  actualId: string;
  error?: string;
}

export class BlockValidator {
  /**
   * Validate block height is exactly one unit higher than current height
   */
  static validateBlockHeight(height: number, currentHeight: number): BlockHeightValidationResult {
    const expectedHeight = currentHeight + 1;
    
    if (height !== expectedHeight) {
      const error = `Invalid block height. Expected: ${expectedHeight}, Got: ${height}`;
      logger.warn('Block height validation failed', { expectedHeight, actualHeight: height });
      
      return {
        isValid: false,
        currentHeight,
        expectedHeight,
        actualHeight: height,
        error
      };
    }

    return {
      isValid: true,
      currentHeight,
      expectedHeight,
      actualHeight: height
    };
  }

  /**
   * Validate block ID matches the calculated hash
   */
  static validateBlockId(block: Block): BlockIdValidationResult {
    const expectedId = BlockValidator.calculateBlockId(block.height, block.transactions);
    
    if (block.id !== expectedId) {
      const error = `Invalid block ID. Expected: ${expectedId}, Got: ${block.id}`;
      logger.warn('Block ID validation failed', { expectedId, actualId: block.id });
      
      return {
        isValid: false,
        expectedId,
        actualId: block.id,
        error
      };
    }

    return {
      isValid: true,
      expectedId,
      actualId: block.id
    };
  }

  /**
   * Calculate the expected block ID using SHA256
   */
  static calculateBlockId(height: number, transactions: Transaction[]): string {
    const dataToHash = height.toString() + transactions.map(tx => tx.id).join('');
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Comprehensive block validation
   */
  static validateBlock(block: Block, currentHeight: number): BlockValidationResult {
    const errors: string[] = [];

    // Validate block height
    const heightValidation = BlockValidator.validateBlockHeight(block.height, currentHeight);
    if (!heightValidation.isValid) {
      errors.push(heightValidation.error!);
    }

    // Validate block ID
    const idValidation = BlockValidator.validateBlockId(block);
    if (!idValidation.isValid) {
      errors.push(idValidation.error!);
    }

    // Validate block structure
    if (!block.transactions || !Array.isArray(block.transactions)) {
      errors.push('Block must contain a valid transactions array');
    }

    if (!block.id || typeof block.id !== 'string') {
      errors.push('Block must have a valid ID');
    }

    if (typeof block.height !== 'number' || block.height < 1) {
      errors.push('Block height must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate block for genesis (first block)
   */
  static validateGenesisBlock(block: Block): BlockValidationResult {
    const errors: string[] = [];

    // Genesis block must have height 1
    if (block.height !== 1) {
      errors.push('Genesis block must have height 1');
    }

    // Genesis block should typically have at least one transaction
    if (!block.transactions || block.transactions.length === 0) {
      errors.push('Genesis block must contain at least one transaction');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
