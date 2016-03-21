'use strict';

const chalk = require('chalk');

class Log {

  static write(message, withNewline) {
    if (typeof withNewline == 'undefined') {
      withNewline = true;
    }
    if (withNewline) {
      console.log(message);
    } else {
      process.stdout.write(message);
    }
  }

  static error(message, withNewline) {
    if (typeof message == 'object') {
      message = message.stack;
    }
    this.write(chalk.red(message), withNewline);
  }

  static debug(message, withNewline) {
    this.write(chalk.white(message), withNewline);
  }

  static info(message, withNewline) {
    this.write(chalk.cyan(message), withNewline);
  }

  static warning(message, withNewline) {
    this.write(chalk.yellow(message), withNewline);
  }

  static success(message, withNewline) {
    this.write(chalk.green(message), withNewline);
  }
}

module.exports = Log;
