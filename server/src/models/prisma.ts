/**
 * Access point for the database client. Services import the client from here,
 * so the instance is created in exactly one place.
 */

export { checkDatabaseConnection, prisma } from '../database/index.js';
