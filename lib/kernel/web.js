'use strict';

const express = require('express');
const Kernel = require('./index');
const http = require('http');
const middleware = require('express/lib/middleware/init');
const co = require('co');

express.response._render = express.response.render;
express.response.render = function (view, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback != 'function') {
    return new Promise((resolve, reject) => {
      this._render(view, options, (err, output) => {
        if (err) {
          this.req.next(err);
          return reject(err);
        }
        this.send(output);
        return resolve(output);
      });
    });
  }
  return this._render(view, options, callback);
}

express.response._sendFile = express.response.sendFile;
express.response.sendFile = function (path, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback != 'function') {
    return new Promise((resolve, reject) => {
      this._sendFile(path, options, err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }
  return this._sendFile(path, options, callback);
}

express.response._sendfile = express.response.sendfile;
express.response.sendfile = function (path, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  if (typeof callback != 'function') {
    return new Promise((resolve, reject) => {
      this._sendfile(path, options, err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }
  return this._sendfile(path, options, callback);
}

express.application.lazyrouter = function () {
  if (!this._router) {
    this._router = new Chen.Router.Express({
      caseSensitive: this.enabled('case sensitive routing'),
      strict: this.enabled('strict routing')
    });
    this._router.use(express.query(this.get('query parser fn')));
    this._router.use(middleware.init(this));
  }
}

class WebKernel extends Kernel {

  constructor(dir) {
    super(dir);
    this.server = express();
  }

  provideLogger() {
    let morgan = require('morgan');
    this.server.use(morgan('short'));
  }

  provideProfilerStop() {
    this.server.use((req, res, next) => {
      this.log(req, res);
      return next();
    });
  }

  provideSession() {
    let session = require('express-session');
    if (!this.config.session.secret) {
      this.config.session.secret = this.config.app.key;
    }
    let params = _.clone(this.config.session);
    let driver = 'memory';
    if (params.store && params.store.driver) {
      driver = params.store.driver;
    }
    switch (driver) {
      case 'redis':
        let RedisStore = require('connect-redis')(session);
        params.store = new RedisStore(params.store.connection);
        break;
      default:
        delete params.store;
        break;
    }
    this.server.use(session(params));
  }

  provideViewEngine() {
    if (!this.config.view.engine) {
      this.config.view.engine = 'swig';
    }
    if (typeof this.config.view.cache != 'boolean') {
      this.config.view.cache = false;
    }
    if (typeof this.config.view.options != 'object') {
      this.config.view.options = {};
    }
    if (this.config.view.engine == 'swig') {
      let swig = require('swig');
      swig.setDefaults(this.config.view.options);
      this.server.engine('swig', swig.renderFile);
    }
    this.server.set('views', this.dir + '/views');
    this.server.set('view engine', this.config.view.engine);
    this.server.set('view cache', this.config.view.cache);
  }

  provideExpressSettings() {
    if (typeof this.config.app.settings != 'object' || !this.config.app.settings) return;
    let settings = this.config.app.settings;
    for (let i in settings) {
      this.server.set(i, settings[i]);
    }
  }

  provideLocals() {
    if (typeof this.config.app.locals != 'object' || !this.config.app.locals) return;
    let locals = this.config.app.locals;
    for (let i in locals) {
      this.server.locals[i] = locals[i];
    }
  }

  use(middleware) {
    this.server.use.apply(this.server, Array.prototype.slice.call(arguments));
  }

  provideRoutes() {
    if (typeof this.config.router == 'object' && this.config.router) {
      this.server.set('case sensitive routing', this.config.router.caseSensitiveRouting);
      this.server.set('strict routing', this.config.router.strictRouting);
    }
    let router = new Chen.Router(this);
    let setup = require(this.dir + '/http/routes');
    if (typeof setup != 'function') {
      throw new Error('http/routes.js must export a callable function');
    }
    setup(router);
    this.server.use(router.getExpressRouter());
  }

  provideSocketIOEvents(httpServer) {
    Chen.SocketIO = require('../socketio');
    Chen.SocketIO.configure(httpServer, this.config.socketio);
    this.io = Chen.SocketIO.getInstance();
    let events = new Chen.SocketIO.Events(this);
    let setup = require(this.dir + '/socketio/events');
    if (typeof setup != 'function') {
      throw new Error('socketio/events.js must export a callable function');
    }
    setup(events);
    events.register();
  }

  provideBodyParser() {
    let bodyParser = require('body-parser');
    let urlencodedConf = this.config.requestBodyParser.urlencoded;
    urlencodedConf.extended = true;
    this.server.use(bodyParser.urlencoded(urlencodedConf));
    let jsonConf = this.config.requestBodyParser.json;
    this.server.use(bodyParser.json(jsonConf));
    let multer = require('multer');
    this.server.use(multer({

    }));
  }

  run() {
    let runFn = co.wrap(function *() {

      this.provideExpressSettings();
      this.provideLocals();
      this.provideLogger();
      this.provideBodyParser();
      this.provideSession();
      this.provideViewEngine();
      yield this.provideDatabase();
      yield this.provideServices();
      this.provideRoutes();

      let httpBoot = require(this.dir + '/http/boot');
      if (_.isGeneratorFunction(httpBoot)) {
        yield httpBoot(this);
      }

      let httpServer = http.Server(this.server);
      if (this.config.socketio) {
        this.provideSocketIOEvents(httpServer);
      }

      httpServer.listen(Chen.getArg('port') || this.config.app.port, () => {
        Chen.Log.success('Started');
      });
    });
    runFn.call(this)
      .catch(err => {
        Chen.Log.error(err);
      });
  }
}

Chen.Router = require('../router');
Chen.Middleware = require('../middleware');
Chen.Controller = require('../controller');

module.exports = WebKernel;
