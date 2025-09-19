export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  connectionTimeout?: number;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Parse DATABASE_URL format: postgres://username:password@host:port/database
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mydatabase',
    username: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  };
};
