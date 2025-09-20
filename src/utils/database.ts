import DatabaseConnection from '../database/connection';
import logger from '../logger/index';

export class DatabaseUtils {
  private static db = DatabaseConnection.getInstance();

  /**
   * Execute a transaction with automatic rollback on error
   */
  public static async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a table exists
   */
  public static async tableExists(tableName: string): Promise<boolean> {
    const result = await this.db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  }

  /**
   * Get table information
   */
  public static async getTableInfo(tableName: string) {
    const result = await this.db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    return result.rows;
  }

  /**
   * Get all table names in the database
   */
  public static async getAllTables(): Promise<string[]> {
    const result = await this.db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    return result.rows.map((row: any) => row.table_name);
  }

  /**
   * Execute a query with retry logic
   */
  public static async queryWithRetry<T>(
    query: string,
    params: any[] = [],
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.db.query(query, params);
        return result as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        logger.warn(`Query attempt ${attempt} failed, retrying in ${delayMs}ms...`, { attempt, maxRetries });
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
    
    throw lastError!;
  }

  /**
   * Health check for database connection
   */
  public static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.db.query('SELECT 1');
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message
      };
    }
  }
}
