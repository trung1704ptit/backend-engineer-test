// Global database mock for tests
import { MockDatabaseConnection } from './test-utils';

// Create a singleton mock instance
export const mockDatabaseConnection = MockDatabaseConnection.getInstance();

// Helper function to replace database connection in services
export function mockServiceDatabase(service: any) {
  if (service.db) {
    service.db = mockDatabaseConnection;
  }
}

// Helper function to mock all database connections in multiple services
export function mockMultipleServicesDatabase(...services: any[]) {
  services.forEach(service => mockServiceDatabase(service));
}
