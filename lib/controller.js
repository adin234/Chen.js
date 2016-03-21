'use strict';

class Controller {

  constructor(app) {
    this.app = app;
  }

  get config() {
    return this.app.config;
  }
}

module.exports = Controller;
