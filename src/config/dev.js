const host = process.env.DB_HOST || 'localhost';

module.exports = {
  server: {
    port: 9000
  },
  database: {
    url: `mongodb://${host}/node-express-skeleton-dev`,
    properties: {
      useMongoClient: true
    }
  },
  key: {
    privateKey: '37LvDSm4XvjYOh9Y',
    tokenExpireInSeconds: 1440
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10
  }
};
