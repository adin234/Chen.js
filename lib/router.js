'use strict';

const methods = require('methods');
const flatten = require('array-flatten');
const co = require('co');

class Router {

  constructor(app, options) {
    this.app = app;
    options = options || {};
    if (typeof options.caseSensitive == 'undefined') {
      options.caseSensitive = app.server.enabled('case sensitive routing');
    }
    if (typeof options.strict == 'undefined') {
      options.strict = app.server.enabled('strict routing');
    }
    this._router = new Router.Express(options);
    if (typeof options.namespace == 'undefined') {
      options.namespace = '';
    }
    if (typeof options.prefix == 'undefined') {
      options.prefix = '/';
    }
    this.prefix = options.prefix;
    this.namespace = options.namespace ? options.namespace + '/' : '';
    this.middleware = [];
    if (typeof options.middleware == 'string' && options.middleware) {
      this.middleware.push(this.findMiddleware(options.middleware));
    } else if (Array.isArray(options.middleware)) {
      for (let mware of options.middleware) {
        this.middleware.push(this.findMiddleware(mware));
      }
    }
  }

  findController(ctrlName) {
    let parts = ctrlName.split('@', 2);
    if (parts.length <= 1) {
      throw new Error('Invalid controller: ' + ctrlName);
    }
    let CtrlClass = require(this.app.dir + '/http/controllers/' + this.namespace + parts[0]);
    if (!_.classExtends(CtrlClass, Chen.Controller)) {
      throw new TypeError(ctrlName + ' must inherit Chen.Controller class');
    }
    if (!_.isGeneratorFunction(CtrlClass.prototype[parts[1]])) {
      throw new TypeError('Controller action must be a generator function: ' + ctrlName);
    }
    let app = this.app;
    let routeFn = co.wrap(function *(req, res, next) {
      return yield (new CtrlClass(app))[parts[1]](req, res, next);
    });
    return function (req, res, next) {
      routeFn.call(this, req, res, next)
        .then(result => {
          return next();
        })
        .catch(err => {
          Chen.Log.error(err);
        });
    }
  }

  findMiddleware(name) {
    if (typeof name == 'function') return name;
    let MiddlewareClass = require(this.app.dir + '/http/middlewares/' + name);
    if (!_.isGeneratorFunction(MiddlewareClass.prototype.handle)) {
      throw new TypeError(name + ' middleware handle function must be a generator');
    }
    let app = this.app;
    let middlewareFn = co.wrap(function *(req, res, next) {
      return yield (new MiddlewareClass(app)).handle(req, res, next);
    });
    return function (req, res, next) {
      middlewareFn.call(this, req, res, next)
        .catch(err => {
          Chen.Log.error(err);
        });
    }
  }

  use(middleware) {
    this._router.use.apply(this._router, Array.prototype.slice.call(arguments));
  }

  getExpressRouter() {
    return this._router;
  }

  group(options, closure) {
    if (typeof options == 'function') {
      closure = options;
      options = {};
    }
    options.strict = this._router.strict;
    options.caseSensitive = this._router.caseSensitive;
    if (typeof options.middleware != 'undefined') {
      options.middleware = this.middleware.concat(options.middleware);
    } else {
      options.middleware = _.clone(this.middleware);
    }
    options.namespace = this.namespace + (options.namespace || '');
    let childRouter = new Router(this.app, options);
    closure(childRouter);
    this.use(childRouter.prefix, childRouter.getExpressRouter());
  }

  controller(prefix, ctrlName) {
    let CtrlClass = require(this.app.dir + '/http/controllers/' + this.namespace + ctrlName);
    if (!_.classExtends(CtrlClass, Chen.Controller)) {
      throw new TypeError(ctrlName + ' must inherit Chen.Controller class');
    }
    let detectFirstUpper = /[A-Z]/;
    Object.getOwnPropertyNames(CtrlClass.prototype).forEach(name => {
      if (name == 'constructor') return;
      let desc = Object.getOwnPropertyDescriptor(CtrlClass.prototype, name);
      if (typeof desc.value == 'function' && _.isGeneratorFunction(desc.value)) {
        let match = detectFirstUpper.exec(name);
        if (match) {
          let method = name.substr(0, match.index);
          if (typeof this[method] == 'function') {
            let path = name.substr(match.index);
            path = path == 'Index' ? '/' : path;
            path = _.kebabCase(path);
            this[method]('/' + _.trim(prefix, '/') + (path ? '/' + path : ''), ctrlName + '@' + name);
          }
        }
      }
    });
  }

  resource(prefix, ctrlName) {
    let CtrlClass = require(this.app.dir + '/http/controllers/' + this.namespace + ctrlName);
    if (!_.classExtends(CtrlClass, Chen.Controller)) {
      throw new TypeError(ctrlName + ' must inherit Chen.Controller class');
    }
    prefix = '/' + _.trim(prefix, '/');
    let action = Object.getOwnPropertyDescriptor(CtrlClass.prototype, 'store');
    if (action) {
      this.post(prefix, ctrlName + '@store');
    }
    action = Object.getOwnPropertyDescriptor(CtrlClass.prototype, 'destroy');
    if (action) {
      this.delete(prefix + '/:id', ctrlName + '@destroy');
    }
    action = Object.getOwnPropertyDescriptor(CtrlClass.prototype, 'update');
    if (action) {
      this.put(prefix + '/:id', ctrlName + '@update');
    }
    action = Object.getOwnPropertyDescriptor(CtrlClass.prototype, 'show');
    if (action) {
      this.get(prefix + '/:id', ctrlName + '@show');
    }
    action = Object.getOwnPropertyDescriptor(CtrlClass.prototype, 'index');
    if (action) {
      this.get(prefix, ctrlName + '@index');
    }
  }
}

methods.forEach(method => {
  Router.prototype[method] = function (path, options) {
    let callbacks = _.clone(this.middleware);
    if (typeof options == 'object' && options) {

      if (typeof options.middleware == 'string' && options.middleware) {
        callbacks.push(this.findMiddleware(options.middleware));
      } else if (Array.isArray(options.middleware)) {
        for (let mware of options.middleware) {
          callbacks.push(this.findMiddleware(mware));
        }
      }

      if (typeof options.uses == 'string' && options.uses) {
        callbacks.push(this.findController(options.uses));
      }

    } else if (typeof options == 'string') {
      callbacks.push(this.findController(options));
    }

    return this._router[method](path, callbacks);
  }
});

Router.Express = require('express').Router;
Router.Express._use = Router.Express.use;
Router.Express.use = function (middleware) {
  let newArgs = [];
  let args = flatten(Array.prototype.slice.call(arguments));
  args.forEach(param => {
    if (!_.isGeneratorFunction(param)) {
      newArgs.push(param);
      return;
    }
    let fn = co.wrap(param);
    newArgs.push(function (req, res, next) {
      fn.call(this, req, res, next)
        .catch(err => {
          Chen.Log.error(err);
        });
    });
  });
  this._use.apply(this, newArgs);
}

module.exports = Router;
