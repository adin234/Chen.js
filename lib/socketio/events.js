'use strict';

const co = require('co');
const DEFAULT_NAMESPACE = '/';

class Events {

  constructor(app) {
    this.app = app;
    this.events = {};
    this.eventArguments = {};
    this.namespace = DEFAULT_NAMESPACE;
  }

  on(eventName, listener, args) {
    if (!this.events[this.namespace]) {
      this.events[this.namespace] = {};
    }

    if (!this.eventArguments[this.namespace]) {
      this.eventArguments[this.namespace] = {};
    }

    this.events[this.namespace][eventName] = listener;
    this.eventArguments[this.namespace][eventName] = args;

    return this;
  }

  findHandler(listenerName, namespace, socket) {
    if (typeof listenerName == 'function') return listenerName;
    let parts = listenerName.split('@', 2);
    if (parts.length <= 1) {
      throw new Error('Invalid handler: ' + listenerName);
    }

    let ListenerClass = require(this.app.dir + '/socketio/handlers/' + parts[0]);
    let args = this.eventArguments[namespace] && this.eventArguments[namespace][parts[1]];
    if (!_.classExtends(ListenerClass, Chen.SocketIO.Handler)) {
      throw new TypeError(listenerName + ' must inherit Chen.SocketIO.Handler class');
    }
    if (!_.isGeneratorFunction(ListenerClass.prototype[parts[1]])) {
      throw new TypeError('Handler action must be a generator function: ' + listenerName);
    }

    let app = this.app;
    let eventFn = co.wrap(function *(socket) {
      return yield (new ListenerClass(app))[parts[1]].apply(this, Array.prototype.slice.call(arguments).concat(args || []));
    });

    return function () {
      let args = Array.prototype.slice.call(arguments);
      args.unshift(socket);
      eventFn.apply(this, args)
        .catch(err => {
          Chen.Log.error(err);
        });
    }
  }

  of(namespace, closure) {
    this.namespace = namespace;
    closure(this);
    this.namespace = DEFAULT_NAMESPACE;
    return this;
  }

  register() {
    Object.keys(this.events).forEach(ns => {
      this.app.io.of(ns).on('connection', socket => {
        if (typeof this.events[ns]['connection'] != 'undefined') {
          this.findHandler(this.events[ns]['connection'], ns, socket)();
        }
        for (let eventName in this.events[ns]) {
          socket.on(eventName, this.findHandler(this.events[ns][eventName], ns, socket));
        }
      });
    });
  }
}

module.exports = Events;
