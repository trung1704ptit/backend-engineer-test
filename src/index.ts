import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { DatabaseConnection, MigrationManager, migrations } from './database/index.js';
import logger from './logger/index.js';

const fastify = Fastify({ logger: true });

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

async function testPostgres() {
  const db = DatabaseConnection.getInstance();
  const id = randomUUID();
  const name = 'Satoshi';
  const email = 'Nakamoto';

  await db.query(`DELETE FROM users;`);

  await db.query(`
    INSERT INTO users (id, name, email)
    VALUES ($1, $2, $3);
  `, [id, name, email]);

  const { rows } = await db.query(`
    SELECT * FROM users;
  `);

  logger.info('Users retrieved from database', { userCount: rows.length, users: rows });
}

async function bootstrap() {
  logger.info('Bootstrapping application...');
  
  // Initialize database connection
  const db = DatabaseConnection.getInstance();
  await db.connect();

  // Run migrations
  const migrationManager = new MigrationManager();
  await migrationManager.runMigrations(migrations);

  // Test database functionality
  await testPostgres();
}

try {
  await bootstrap();
  await fastify.listen({
    port: 3000,
    host: '0.0.0.0'
  })
} catch (err) {
  logger.error('Application startup failed', {}, err as Error);
  process.exit(1);
}