'use strict';

class MigrateLatest extends Chen.Command {

  *execute() {
    yield Chen.DB.migrate.latest();
  }
}

module.exports = MigrateLatest;
