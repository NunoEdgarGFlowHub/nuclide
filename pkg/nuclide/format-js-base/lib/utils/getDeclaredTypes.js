'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Collection, Node, NodePath} from '../types/ast';
import type {Options} from '../types/options';

var jscs = require('jscodeshift');

type ConfigEntry = {
  searchTerms: [any, Object],
  filters: Array<(path: NodePath) => boolean>,
  getNodes: (path: NodePath) => Array<Node>,
};

var CONFIG: Array<ConfigEntry> = [
  {
    searchTerms: [
      jscs.ImportDeclaration,
      {importKind: 'type'},
    ],
    filters: [],
    getNodes: path => path.node.specifiers.map(specifier => specifier.local),
  },
  {
    searchTerms: [jscs.TypeAlias],
    filters: [],
    getNodes: path => [path.node.id],
  },
  {
    searchTerms: [jscs.TypeParameterDeclaration],
    filters: [],
    getNodes: path => path.node.params,
  },

  // TODO: remove these, they should be covered by TypeParameterDeclaration
  // but there is a bug in jscodeshift
  {
    searchTerms: [jscs.ClassDeclaration],
    filters: [
      path => (
        path.node.typeParameters &&
        Array.isArray(path.node.typeParameters.params)
      ),
    ],
    getNodes: path => path.node.typeParameters.params,
  },
];

/**
 * This will get a list of all flow types that are declared within root's AST
 */
function getDeclaredTypes(root: Collection, options: Options): Set<string> {
  // Start with the built in types that are always declared.
  var ids = new Set(options.builtInTypes);
  CONFIG.forEach(config => {
    root
      .find(config.searchTerms[0], config.searchTerms[1])
      .filter(path => config.filters.every(filter => filter(path)))
      .forEach(path => {
        var nodes = config.getNodes(path);
        nodes.forEach(node => {
          if (jscs.Identifier.check(node)) {
            ids.add(node.name);
          }
        });
      });
  });
  return ids;
}

module.exports = getDeclaredTypes;
