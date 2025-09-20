import logger from '../logger';
import type { RollbackInfo } from '../types/rollback.types';

export interface RollbackValidationResult {
  isValid: boolean;
  currentHeight: number;
  requiresConfirmation: boolean;
  message?: string;
  error?: string;
}

export interface RollbackConfirmationResult {
  isValid: boolean;
  confirmed: boolean;
  message?: string;
}

export interface RollbackSafetyResult {
  isSafe: boolean;
  blocksToRemove: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
}

export class RollbackValidator {
  /**
   * Validate rollback request parameters
   */
  static validateRollbackRequest(
    targetHeight: number,
    currentHeight: number,
    confirmed: boolean = false
  ): RollbackValidationResult {
    // Validate target height is valid
    if (typeof targetHeight !== 'number' || !Number.isInteger(targetHeight) || targetHeight < 1) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: false,
        error: 'Target height must be a positive integer'
      };
    }

    // Validate target height is not current or future
    if (targetHeight >= currentHeight) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: false,
        error: 'Cannot rollback to current or future height'
      };
    }

    const blocksToRemove = currentHeight - targetHeight;
    const requiresConfirmation = blocksToRemove > 10;

    // Check if confirmation is required but not provided
    if (requiresConfirmation && !confirmed) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: true,
        error: 'This rollback operation requires confirmation'
      };
    }

    // Validate rollback is not too deep (max 2000 blocks as per requirements)
    if (blocksToRemove > 2000) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: true,
        error: 'Rollback operation exceeds maximum allowed depth (2000 blocks)'
      };
    }

    return {
      isValid: true,
      currentHeight,
      requiresConfirmation,
      message: 'Rollback request is valid'
    };
  }

  /**
   * Assess the safety level of a rollback operation
   */
  static assessRollbackSafety(
    targetHeight: number,
    currentHeight: number,
    lastRollback: RollbackInfo | null
  ): RollbackSafetyResult {
    const blocksToRemove = currentHeight - targetHeight;

    // Determine risk level based on blocks to remove
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (blocksToRemove <= 5) {
      riskLevel = 'low';
    } else if (blocksToRemove <= 10) {
      riskLevel = 'medium';
    } else if (blocksToRemove <= 50) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    // Check if this is a very recent rollback (within last hour)
    const isRecentRollback = lastRollback && 
      (Date.now() - new Date(lastRollback.timestamp).getTime()) < 3600000; // 1 hour

    if (isRecentRollback) {
      riskLevel = 'critical';
    }

    let message: string | undefined;
    switch (riskLevel) {
      case 'low':
        message = 'Low risk rollback operation';
        break;
      case 'medium':
        message = 'Medium risk rollback operation - consider impact';
        break;
      case 'high':
        message = 'High risk rollback operation - requires careful consideration';
        break;
      case 'critical':
        message = 'Critical risk rollback operation - not recommended';
        break;
    }

    return {
      isSafe: riskLevel !== 'critical',
      blocksToRemove,
      riskLevel,
      message
    };
  }

  /**
   * Validate rollback confirmation
   */
  static validateRollbackConfirmation(
    confirmed: boolean,
    requiresConfirmation: boolean
  ): RollbackConfirmationResult {
    if (requiresConfirmation && !confirmed) {
      return {
        isValid: false,
        confirmed: false,
        message: 'Confirmation required for this rollback operation'
      };
    }

    return {
      isValid: true,
      confirmed,
      message: confirmed ? 'Rollback confirmed' : 'No confirmation required'
    };
  }

  /**
   * Validate rollback target height is reasonable
   */
  static validateRollbackTarget(
    targetHeight: number,
    currentHeight: number,
    genesisHeight: number = 1
  ): RollbackValidationResult {
    // Cannot rollback to or below genesis
    if (targetHeight < genesisHeight) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: false,
        error: `Cannot rollback below genesis height (${genesisHeight})`
      };
    }

    // Cannot rollback to current or future height
    if (targetHeight >= currentHeight) {
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: false,
        error: 'Cannot rollback to current or future height'
      };
    }

    // Check if rollback would remove too many blocks
    const blocksToRemove = currentHeight - targetHeight;
    if (blocksToRemove > currentHeight * 0.9) { // More than 90% of blockchain
      return {
        isValid: false,
        currentHeight,
        requiresConfirmation: false,
        error: 'Rollback would remove more than 90% of the blockchain'
      };
    }

    return {
      isValid: true,
      currentHeight,
      requiresConfirmation: blocksToRemove > 10,
      message: 'Rollback target is valid'
    };
  }

  /**
   * Comprehensive rollback validation
   */
  static validateRollbackOperation(
    targetHeight: number,
    currentHeight: number,
    confirmed: boolean = false,
    lastRollback: RollbackInfo | null = null
  ): {
    validation: RollbackValidationResult;
    safety: RollbackSafetyResult;
    confirmation: RollbackConfirmationResult;
    overall: { isValid: boolean; errors: string[] };
  } {
    const validation = RollbackValidator.validateRollbackRequest(targetHeight, currentHeight, confirmed);
    const safety = RollbackValidator.assessRollbackSafety(targetHeight, currentHeight, lastRollback);
    const confirmation = RollbackValidator.validateRollbackConfirmation(confirmed, validation.requiresConfirmation);

    const errors: string[] = [];
    if (!validation.isValid) {
      errors.push(validation.error!);
    }
    if (!safety.isSafe) {
      errors.push(`Rollback is not safe: ${safety.message}`);
    }
    if (!confirmation.isValid) {
      errors.push(confirmation.message!);
    }

    return {
      validation,
      safety,
      confirmation,
      overall: {
        isValid: errors.length === 0,
        errors
      }
    };
  }

  /**
   * Check if rollback is allowed based on system state
   */
  static isRollbackAllowed(
    currentHeight: number,
    lastRollback: RollbackInfo | null,
    systemMaintenanceMode: boolean = false
  ): boolean {
    // Don't allow rollbacks during maintenance
    if (systemMaintenanceMode) {
      logger.warn('Rollback blocked: system in maintenance mode');
      return false;
    }

    // Don't allow rollbacks if there was a recent rollback
    if (lastRollback) {
      const timeSinceLastRollback = Date.now() - new Date(lastRollback.timestamp).getTime();
      const oneHour = 3600000; // 1 hour in milliseconds
      
      if (timeSinceLastRollback < oneHour) {
        logger.warn('Rollback blocked: recent rollback detected', { 
          timeSinceLastRollback,
          lastRollbackHeight: lastRollback.toHeight
        });
        return false;
      }
    }

    // Don't allow rollbacks if blockchain is too short
    if (currentHeight < 2) {
      logger.warn('Rollback blocked: blockchain too short', { currentHeight });
      return false;
    }

    return true;
  }
}
