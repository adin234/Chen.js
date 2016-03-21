'use strict';

const _ = require('lodash');
const isGenerator = require('is-generator');

_.explode = function (delimiter, string, limit) {

  if (arguments.length < 2 || typeof delimiter === 'undefined' || typeof string === 'undefined') return null;
  if (delimiter === '' || delimiter === false || delimiter === null) return false;
  if (typeof delimiter === 'function' || typeof delimiter === 'object' || typeof string === 'function' || typeof string ===
    'object') {
    return {
      0: ''
    };
  }
  if (delimiter === true) delimiter = '1';

  // Here we go...
  delimiter += '';
  string += '';

  let s = string.split(delimiter);

  if (typeof limit === 'undefined') return s;

  // Support for limit
  if (limit === 0) limit = 1;

  // Positive limit
  if (limit > 0) {
    if (limit >= s.length) return s;
    return s.slice(0, limit - 1)
      .concat([s.slice(limit - 1)
        .join(delimiter)
      ]);
  }

  // Negative limit
  if (-limit >= s.length) return [];

  s.splice(s.length + limit);
  return s;
}

_.replaceAll = function (str, search, replace) {
  return str.replace(new RegExp(_.escapeRegExp(search), 'g'), replace);
}

_.classExtends = function (childClass, parentClass) {
  return typeof childClass == 'function' && childClass.prototype instanceof parentClass;
}

_.isGeneratorFunction = function (fn) {
  return isGenerator.fn(fn);
}

_.isGenerator = function (obj) {
  return isGenerator(obj);
}

module.exports = _;
