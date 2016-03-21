'use strict';

let args = process.argv.slice(2);
const CLI_ARGS = {};
for (let arg of args) {
  if (arg.indexOf('--') !== 0) {
    continue;
  }
  let parts = _.explode('=', _.trimLeft(arg, '--'), 2);
  CLI_ARGS[parts[0]] = parts[1];
}

const Chen = {

  Log: require('./log'),

  getEnv(name, defaultVal) {
    if (typeof process.env[name] == 'undefined') {
      if (typeof defaultVal != 'undefined') {
        return defaultVal;
      }
      return null;
    }
    let env = process.env[name];
    if (typeof env == 'string' && env.toLowerCase() === 'null') {
      return null;
    }
    return env;
  },

  getArg(name, defaultVal) {
    if (typeof CLI_ARGS[name] == 'undefined') {
      if (typeof defaultVal != 'undefined') {
        return defaultVal;
      }
      return null;
    }
    return CLI_ARGS[name];
  },

  createWebAppFromDir(dir) {
    return new (require('./kernel/web'))(dir);
  },

  createConsoleAppFromDir(dir) {
    return new (require('./kernel/console'))(dir);
  }
};

module.exports = Chen;
