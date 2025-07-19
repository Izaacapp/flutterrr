// config/environments.js
// Single source of truth for all environments

const environments = {
  development: {
    name: 'Development',
    api: {
      host: 'localhost',
      port: 3000,
      url: 'http://localhost:3000',
      graphql: 'http://localhost:3000/graphql',
    },
    web: {
      host: 'localhost',
      port: 3001,
      url: 'http://localhost:3001',
    },
    mongodb: {
      host: 'localhost',
      port: 27017,
      url: 'mongodb://root:pass@localhost:27017/devdb?authSource=admin',
    },
    mobile: {
      android: 'http://10.0.2.2:3000',  // Android emulator
      ios: 'http://localhost:3000',      // iOS simulator
      physical: 'http://YOUR_LOCAL_IP:3000', // Physical devices
    }
  },
  
  production: {
    name: 'Production',
    api: {
      host: '138.197.72.196',
      port: 3000,
      url: 'http://138.197.72.196:3000',
      graphql: 'http://138.197.72.196:3000/graphql',
    },
    web: {
      host: '138.197.72.196',
      port: 8080,
      url: 'http://138.197.72.196:8080',
    },
    mongodb: {
      host: 'mongodb',
      port: 27017,
      url: 'mongodb://admin:prod_secure_password@mongodb:27017/proddb?authSource=admin',
    },
    jenkins: {
      url: 'http://138.197.72.196:8080',
    }
  },
  
  staging: {
    name: 'Staging',
    // Add staging environment when ready
  }
};

// Helper to get current environment
const getCurrentEnvironment = () => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

// Helper to get config for current environment
const getConfig = () => {
  return environments[getCurrentEnvironment()];
};

module.exports = {
  environments,
  getCurrentEnvironment,
  getConfig,
};