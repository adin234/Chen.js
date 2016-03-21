'use strict';

class MigrateMake extends Chen.Command {

  *execute(name) {
    if (!name) return;
    yield Chen.DB.migrate.make(name);
  }
}

module.exports = MigrateMake;
