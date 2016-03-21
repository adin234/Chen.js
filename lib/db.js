'use strict';

const fs = require('fs');
const path = require('path');

class DB {

  constructor(options) {
    this.options = options;
  }

  connect() {
    this.knex = require('knex')(this.options);
  }

  query(table) {
    return this.knex(table).select();
  }

  get migrate() {
    return this.knex.migrate;
  }

  static load(name) {
    if (!DB.configs.has(name)) {
      throw new Error('DB configuration ' + name + ' can\'t be loaded');
    }
    if (!DB.loaded.has(name)) {
      let db = new DB(DB.configs.get(name));
      db.connect();
      DB.loaded.set(name, db);
    }
    return DB.loaded.get(name);
  }

  static connection(name) {
    if (typeof name == 'undefined') {
      if (!DB.default) return null;
      return DB.loaded.get(DB.default);
    }
    return DB.loaded.get(name);
  }

  static *configure(app) {
    if (!app.config.database.connections) return;
    let config = app.config.database;
    for (let key in config.connections) {
      config.connections[key].migrations = {
        tableName: 'migrations',
        directory: app.dir + '/database/migrations'
      };
      DB.configs.set(key, config.connections[key]);
    }
    if (config.default) {
      DB.default = config.default;
      if (!DB.configs.has(config.default)) {
        throw new Error('Database connection ' + config.default + ' doesn\'t exists');
      }
      DB.load(config.default);
      yield DB.loadModelsFromDir(app.dir + '/models');
    }
  }

  static *loadModelsFromDir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          return reject(err);
        }
        files.forEach(filename => {
          if (_.endsWith(filename, '.js')) {
            let name = path.basename(filename, '.js');
            global[name] = require(dir + '/' + name);
          }
        });
        return resolve();
      });
    });
  }
}

DB.default = null;
DB.loaded = new Map();
DB.configs = new Map();

Object.getOwnPropertyNames(DB.prototype).forEach(name => {
  if (name == 'constructor') return;
  let desc = Object.getOwnPropertyDescriptor(DB.prototype, name);
  if (typeof desc.get == 'function') {
    Object.defineProperty(DB, name, {
      get: function () {
        return DB.connection()[name];
      }
    });
  } else if (typeof desc.value == 'function') {
    if (_.isGeneratorFunction(desc.value)) {
      DB[name] = function *() {
        let conn = DB.connection();
        return yield conn[name].apply(conn, Array.prototype.slice.call(arguments));
      }
    } else {
      DB[name] = function () {
        let conn = DB.connection();
        return conn[name].apply(conn, Array.prototype.slice.call(arguments));
      }
    }
  }
});

let TableClass = null;
Object.defineProperty(DB, 'Table', {
  get: function () {
    if (!TableClass) {
      let bookshelf = require('bookshelf')(DB.connect().knex);
      bookshelf.plugin('registry');
      bookshelf.plugin('virtuals');
      bookshelf.plugin('visibility');
      TableClass = bookshelf;
    }
    return TableClass;
  }
});

module.exports = DB;
