'use strict';

module.exports = {

  app: {
    env: Chen.getEnv('APP_ENV', 'production'),
    key: Chen.getEnv('APP_KEY', 'key'),
    debug: Chen.getEnv('APP_DEBUG', true),
    port: Chen.getArg('port', 3000),
    timezone: 'Asia/Manila',
    settings: {},
    locals: {
      name: 'Coded'
    }
  },

  socketio: {
    serveClient: true,
    path: '/socket.io'
  },

  router: {
    caseSensitiveRouting: false,
    strictRouting: false
  },

  database: {
    default: 'default',
    connections: {
      default: {
        client: 'mysql',
        connection: {
          host: Chen.getEnv('DB_HOST', 'localhost'),
          user: Chen.getEnv('DB_USERNAME', 'root'),
          password: Chen.getEnv('DB_PASSWORD', ''),
          database: Chen.getEnv('DB_DATABASE', 'database'),
          charset: 'utf8'
        }
      }
    }
  },

  requestBodyParser: {
    urlencoded: {
      inflate: true,
      limit: '100kb',
      parameterLimit: 1000
    },
    json: {
      inflate: true,
      limit: '100kb',
      strict: true
    }
  },

  upload: {

  },

  session: {
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: null
    },
    store: {
      driver: 'redis',
      connection: {}
    }
  },

  assets: {

  },

  view: {
    engine: 'swig',
    cache: false
  },

  services: {}
};
