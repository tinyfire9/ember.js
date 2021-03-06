import { assert } from '@ember/debug';
import { AST, ASTPlugin } from '@glimmer/syntax';
import calculateLocationDisplay from '../system/calculate-location-display';
import { EmberASTPluginEnvironment } from '../types';
import { isPath, trackLocals } from './utils';

export default function assertLocalVariableShadowingHelperInvocation(
  env: EmberASTPluginEnvironment
): ASTPlugin {
  let { moduleName } = env.meta;
  let { hasLocal, node } = trackLocals();

  if (env.strictMode) {
    return {
      name: 'assert-local-variable-shadowing-helper-invocation',
      visitor: {},
    };
  }

  return {
    name: 'assert-local-variable-shadowing-helper-invocation',

    visitor: {
      Program: node,

      ElementNode: {
        keys: {
          children: node,
        },
      },

      MustacheStatement(node: AST.MustacheStatement) {
        if (isPath(node.path) && hasArguments(node)) {
          let name = node.path.parts[0];
          let type = 'helper';

          assert(
            `${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`,
            !isLocalVariable(node.path, hasLocal)
          );
        }
      },

      SubExpression(node: AST.SubExpression) {
        if (isPath(node.path)) {
          let name = node.path.parts[0];
          let type = 'helper';

          assert(
            `${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`,
            !isLocalVariable(node.path, hasLocal)
          );
        }
      },

      ElementModifierStatement(node: AST.ElementModifierStatement) {
        if (isPath(node.path)) {
          let name = node.path.parts[0];
          let type = 'modifier';

          assert(
            `${messageFor(name, type)} ${calculateLocationDisplay(moduleName, node.loc)}`,
            !isLocalVariable(node.path, hasLocal)
          );
        }
      },
    },
  };
}

function isLocalVariable(node: AST.PathExpression, hasLocal: (k: string) => boolean): boolean {
  return !node.this && node.parts.length === 1 && hasLocal(node.parts[0]);
}

function messageFor(name: string, type: string): string {
  return `Cannot invoke the \`${name}\` ${type} because it was shadowed by a local variable (i.e. a block param) with the same name. Please rename the local variable to resolve the conflict.`;
}

function hasArguments(node: AST.MustacheStatement): boolean {
  return node.params.length > 0 || node.hash.pairs.length > 0;
}
