#!/usr/local/bin/node
'use strict';

const co = require('co');
const Chen = require('./index');
const CommandFactory = require('./lib/commands/factory');

let command = CommandFactory.recognize(__dirname + '/lib/commands/cli');
if (!command) {
  Chen.Log.debug('Not recognized command');
  process.exit(0);
}

co(function *() {
  yield command.execute.apply(command, process.argv.slice(3));
})
.catch(err => {
  Chen.Log.error(err);
});
