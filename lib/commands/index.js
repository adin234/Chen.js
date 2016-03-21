'use strict';

class Command {

  constructor(app) {
    this.app = app;
  }

  get config() {
    return this.app.config;
  }
}

module.exports = Command;
