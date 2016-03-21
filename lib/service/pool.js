'use strict';

const fs = require('fs');
const path = require('path');
const Service = require('./index');

class ServicePool {

  constructor(app) {
    this.app = app;
    this.pool = new Map();
  }

  load() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.app.dir + '/services', (err, files) => {
        if (err) {
          return reject(err);
        }
        let re = /(?:\.([^.]+))?$/;
        files.forEach(filename => {
          if (_.endsWith(filename, 'Service.js')) {
            let name = path.basename(filename, '.js');
            global[name] = this.get(name);
          }
        });
        return resolve();
      });
    });
  }

  get(key) {
    if (!this.pool.has(key)) {
      let ServiceClass = require(this.app.dir + '/services/' + key);
      if (!_.classExtends(ServiceClass, Service)) {
        throw new TypeError(key + ' must be a Service class');
      }
      if (ServiceClass.prototype.constructor.name != key) {
        throw new Error(key + ' filename must be the same with its class name');
      }
      this.pool.set(key, new ServiceClass(this.app));
    }
    return this.pool.get(key);
  }
}

module.exports = ServicePool;
