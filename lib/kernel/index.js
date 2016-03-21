'use strict';

const ServicePool = require('../service/pool');

class Kernel {

  constructor(dir) {
    this.dir = dir;
  }

  configure() {
    require('dotenv').config({
      path: this.dir + '/.env',
      silent: true
    });
    this.config = require(this.dir + '/config');
    return this;
  }

  *provideDatabase() {
    if (!this.config.database.connections) return;
    yield Chen.DB.configure(this);
  }

  *provideServices() {
    this.services = new ServicePool(this);
    yield this.services.load();
  }
}

Chen.DB = require('../db');
Chen.Service = require('../service');

module.exports = Kernel;
