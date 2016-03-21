'use strict';

class Middleware {

  constructor(app) {
    this.app = app;
  }

  get config() {
    return this.app.config;
  }
}

module.exports = Middleware;
