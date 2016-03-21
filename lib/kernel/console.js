'use strict';

const Kernel = require('./index');
const Command = require('../commands');
const CommandFactory = require('../commands/factory');
const pathlib = require('path');
const co = require('co');

class Console extends Kernel {

  constructor(dir) {
    super(dir);
    this.paths = [
      pathlib.normalize(__dirname + '/../commands/artisan') + '/',
      this.dir + '/console/commands/'
    ];
  }

  run() {
    let runFn = co.wrap(function *() {

      yield this.provideDatabase();
      yield this.provideServices();

      let boot = require(this.dir + '/console/boot');
      if (_.isGeneratorFunction(boot)) {
        yield boot(this);
      }

      let command = CommandFactory.recognize(this.paths);
      if (command) {
        return yield command.execute.apply(command, process.argv.slice(3));
      }
    });
    runFn.call(this)
      .then(result => {
        process.exit(0);
      })
      .catch(err => {
        Chen.Log.error(err);
        process.exit(0);
      });
  }
}

Chen.Command = Command;

module.exports = Console;
