const Keycloak = require('keycloak-connect');
const session = require('express-session');

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM,
  'auth-server-url': process.env.KEYCLOAK_SERVER_URL,
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID,
  'confidential-port': 0,
  'bearer-only': true,
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
  const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
  return { keycloak, memoryStore, sessionConfig };
};

module.exports = { initKeycloak }; 