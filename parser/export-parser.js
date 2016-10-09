'use strict';

const fs    = require('fs');
const path  = require('path');
const acorn = require('acorn');
const _     = require('lodash');

const exportParser = {
  config: {},
  exportDeclarations: {},

  init: function() {
    this.exportDeclarations = {
      variables: [],
      functions: [],
      classes  : [],
    };

    if (this.config.entry.slice(-3) === this.config.extension){
      this.config.entry = this.config.entry.slice(0, -3);
    }
  },

  parse: function(moduleName, basePath, config) {
    this.config = config;
    this.moduleName = moduleName;
    this.init();

    const modulePath = path.join(basePath, moduleName);
    this.getExportDeclarations(modulePath, config.entry);
    return this.format(this.exportDeclarations);
  },

  format: function(list) {
    return {
      source   : this.moduleName,
      variables: _.reduce(list.variables, (flattened, arr) => {
                    return flattened.concat(arr);
                  }, []),
      functions: _.reduce(list.functions, (flattened, arr) => {
                    return flattened.concat(arr);
                  }, []),
      classes  : _.reduce(list.classes, (flattened, arr) => {
                    return flattened.concat(arr);
                  }, []),
    };
  },

  getExportDeclarations: function(basePath, location) {
    const fullPath = path.join(basePath, location + this.config.extension);

    let content;
    try {
      content = fs.readFileSync(fullPath);
    } catch (e) {
      console.log(e);
      return;
    }

    const parser = acorn.parse(content, {
      sourceType: this.config.sourceType,
    });

    _.forEach(parser.body, (node) => {
      if (node.type === 'ExportNamedDeclaration') {
        this.parseNode(node);
      } else if (node.type === 'ExportAllDeclaration') {
        this.getExportDeclarations(path.dirname(fullPath), node.source.value);
      }
    });
  },


  parseNode: function(node) {
    if (node.declaration) {
      if (node.declaration.type === 'VariableDeclaration') {
        this.parseVariableDeclarations(node.declaration.declarations);
      } else if (node.declaration.type === 'FunctionDeclaration') {
        this.parseFunctionDeclarations(node.declaration);
      } else {
        console.log('some other declaration found');
      }
    } else if (node.specifiers) {
      this.parseSpecifiers(node.specifiers);
    }
  },

  parseSpecifiers: function(specifiers) {
    if (!specifiers) {
      return;
    }
    this.exportDeclarations.classes.push(
      specifiers.map((specifier) => {
        return specifier.exported.name;
      })
    );
  },

  parseVariableDeclarations: function(declarations) {
    if (!declarations) {
      return;
    }

    this.exportDeclarations.variables.push(
      declarations.map((declaration) => {
        return declaration.id.name;
      })
    );
  },

  parseFunctionDeclarations: function(declaration) {
    if (!declaration) {
      return;
    }
    const names = [];
    // may be these not required ??
    names.push(declaration.id.name);

    this.exportDeclarations.functions.push(names);
  },

};


module.exports = exportParser;
