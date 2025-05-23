const Keycloak = require('keycloak-connect');
const session = require('express-session');
const logger = require('../utils/logger');

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'ai-pc-advisor',
  'auth-server-url': process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080/auth',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'api-gateway',
  'confidential-port': 0,
  'bearer-only': false,
  'verify-token-audience': true,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET
  }
};

// Session configuration for Keycloak
const memoryStore = new session.MemoryStore();
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
};

// Keycloak middleware initialization
const initKeycloak = () => {
  try {
    logger.info('Initializing Keycloak...');
    const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
    logger.info('Keycloak initialized successfully');
    return { keycloak, memoryStore, sessionConfig };
  } catch (error) {
    logger.error(`Error initializing Keycloak: ${error.message}`);
    throw error;
  }
};

module.exports = { initKeycloak }; 