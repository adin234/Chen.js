'use strict';

class SocketIO {

  static configure(httpServer, config) {
    this._server = require('socket.io')(httpServer, config);
  }

  static getInstance() {
    if (!this._server) {
      throw new Error('SocketIO is not yet configured');
    }
    return this._server;
  }
}

SocketIO.Handler = require('./handler');
SocketIO.Events = require('./events');

module.exports = SocketIO;
