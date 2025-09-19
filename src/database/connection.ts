import pkg from 'pg';
const { Pool } = pkg;
import type { PoolClient, Pool as PoolType } from 'pg';
import logger from '../logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: PoolType | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<PoolType> {
    if (this.pool) {
      return this.pool;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Test the connection
    try {
      const client = await this.pool.connect();
      logger.info('Database connected successfully', { 
        host: this.pool.options.host,
        port: this.pool.options.port,
        database: this.pool.options.database 
      });
      client.release();
    } catch (error) {
      logger.error('Database connection failed', {}, error as Error);
      throw error;
    }

    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool!.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool!.query(text, params);
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection closed');
    }
  }

  public getPool(): PoolType | null {
    return this.pool;
  }
}

export default DatabaseConnection;
