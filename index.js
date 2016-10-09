'use strict';

const fs   = require('fs');
const path = require('path');
const exportParser = require('./parser/export-parser');

module.exports = {
  index,
};

function index(moduleName, basePath, configuration) {
  const config = Object.assign({
    entry      : 'index',
  }, configuration, {
    sourceType : 'module',
    extension  : '.js',
  });

  if(!moduleName || !basePath || typeof config.entry !== 'string') {
    return {};
  }

  try {
    fs.accessSync(path.join(basePath, moduleName, config.entry + config.extension));
  } catch (e) {
    return {};
  }

  return {
    exports : exportParser.parse(moduleName, basePath, config),
  };
}
