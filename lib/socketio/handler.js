'use strict';

class Handler {

  constructor(app) {
    this.app = app;
  }

  get io() {
    return this.app.io;
  }
}

module.exports = Handler;
