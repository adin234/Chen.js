'use strict';

const fs = require('fs');

class CommandFactory {

  static recognize(srcDirs) {
    if (!Array.isArray(srcDirs)) {
      srcDirs = [srcDirs];
    }
    let name = process.argv[2];
    if (!name) {
      return null;
    }
    let cmd = null;
    name = _.replaceAll(name, ':', '/');
    try {
      for (let path of srcDirs) {
        if (fs.statSync(path + name + '.js').isFile() || fs.statSync(path + name + '/index.js').isFile()) {
          cmd = path + name;
          break;
        }
      }
    } catch (e) {
      if (e.code != 'ENOENT') {
        throw e;
      }
    }
    if (cmd) {
      let CmdClass = require(cmd);
      if (!_.isGeneratorFunction(CmdClass.prototype.execute)) {
        throw new TypeError('Command.execute must be a generator function');
      }
      cmd = new CmdClass(this);
    }
    return cmd;
  }
}


module.exports = CommandFactory;
