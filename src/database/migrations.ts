import DatabaseConnection from './connection.js';
import logger from '../logger/index.js';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
}

export class MigrationManager {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async initialize(): Promise<void> {
    await this.db.connect();
    await this.createMigrationsTable();
  }

  private async createMigrationsTable(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async runMigrations(migrations: Migration[]): Promise<void> {
    await this.initialize();

    for (const migration of migrations) {
      const hasRun = await this.hasMigrationRun(migration.name);
      
      if (!hasRun) {
        logger.info(`Running migration: ${migration.name}`, { migrationId: migration.id });
        try {
          await this.db.query(migration.up);
          await this.db.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migration.name]
          );
          logger.info(`Migration completed: ${migration.name}`, { migrationId: migration.id });
        } catch (error) {
          logger.error(`Migration failed: ${migration.name}`, { migrationId: migration.id }, error as Error);
          throw error;
        }
      } else {
        logger.debug(`Migration already run: ${migration.name}`, { migrationId: migration.id });
      }
    }
  }

  public async rollbackMigration(migrationName: string): Promise<void> {
    await this.initialize();
    
    const hasRun = await this.hasMigrationRun(migrationName);
    if (!hasRun) {
      throw new Error(`Migration ${migrationName} has not been run`);
    }

    const migration = this.getMigrationByName(migrationName);
    if (!migration) {
      throw new Error(`Migration ${migrationName} not found`);
    }

    logger.info(`Rolling back migration: ${migrationName}`);
    try {
      await this.db.query(migration.down);
      await this.db.query(
        'DELETE FROM migrations WHERE name = $1',
        [migrationName]
      );
      logger.info(`Migration rolled back: ${migrationName}`);
    } catch (error) {
      logger.error(`Rollback failed: ${migrationName}`, {}, error as Error);
      throw error;
    }
  }

  private async hasMigrationRun(migrationName: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT COUNT(*) FROM migrations WHERE name = $1',
      [migrationName]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  private getMigrationByName(name: string): Migration | null {
    // This would typically load migrations from files or a registry
    // For now, we'll return null as this is a placeholder
    return null;
  }

  public async getExecutedMigrations(): Promise<string[]> {
    await this.initialize();
    const result = await this.db.query('SELECT name FROM migrations ORDER BY executed_at');
    return result.rows.map((row: any) => row.name);
  }
}

// Example migrations
export const migrations: Migration[] = [
  {
    id: '001',
    name: 'create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: 'DROP TABLE IF EXISTS users;'
  },
  {
    id: '002',
    name: 'add_user_indexes',
    up: `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `,
    down: `
      DROP INDEX IF EXISTS idx_users_email;
      DROP INDEX IF EXISTS idx_users_created_at;
    `
  }
];
