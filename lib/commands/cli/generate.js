'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const project = [
  'index.js',
  'artisan.js',
  'package.json',
  '.gitignore',
  'app/.env',
  'app/config.js',
  'app/http/boot.js',
  'app/http/routes.js',
  'app/http/controllers/IndexController.js',
  'app/http/middlewares',
  'app/console/boot.js',
  'app/console/commands',
  'app/services',
  'app/models',
  'app/database/migrations',
  'app/database/seeds',
  'app/socketio/events.js',
  'app/socketio/handlers',
  'app/views/index.swig'  
];

class Generate {

  *execute(location) {
    if (!location) {
      Chen.Log.error('Folder name must be specified');
      return;
    }
    if (!path.isAbsolute(location)) {
      location = process.cwd() + '/' + location;
    }
    location = _.trimEnd(location, '/') + '/';
    try {
      for (let file of project) {
        if (!_.startsWith(path.basename(file), '.') && !path.extname(file)) {
          mkdirp.sync(location + file);
          fs.writeFileSync(location + file + '/.gitkeep', '');
        } else {
          mkdirp.sync(location + path.dirname(file));
          let content = fs.readFileSync(
            path.normalize(__dirname + '/../../../templates/' + _.replaceAll(file, '/', '.') + '.tpl')
          );
          fs.writeFileSync(location + file, content);
        }
      }
    } catch (e) {
      Chen.Log.error(e);
      return;
    }
    Chen.Log.success('Done');
  }
}

module.exports = Generate;
