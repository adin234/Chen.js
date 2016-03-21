'use strict';

require('chen')
  .createWebAppFromDir(__dirname + '/app')
  .configure()
  .run();
