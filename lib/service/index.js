'use strict';

class Service {

  constructor(app) {
    this.app = app;
  }

  get config() {
    return this.app.config;
  }
}

module.exports = Service;
