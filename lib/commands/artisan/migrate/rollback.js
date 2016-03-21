'use strict';

class MigrateRollback extends Chen.Command {

  *execute() {
    yield Chen.DB.migrate.rollback();
  }
}

module.exports = MigrateRollback;
