import createSomlContext from './soml-context.js';
import SomlListeners from './soml-listeners.js';

/**
@import {RuleDefinition} from '@eslint/core';
@import {SomlContext} from './soml-context.js';
*/

/**
@typedef {RuleDefinition['create']} EslintCreate
@typedef {(context: SomlContext) => void} SomlCreate
*/

/**
Convert a SOML-style `create`, which adds listeners with `context.on()`, to an ESLint-style `create`, which returns them.

@param {SomlCreate} somlCreate
@returns {EslintCreate}
*/
export default function toEslintCreate(somlCreate) {
	return eslintContext => {
		const somlListeners = new SomlListeners(eslintContext);

		if (somlCreate(createSomlContext(eslintContext, somlListeners)) !== undefined) {
			throw new TypeError(`[${eslintContext.id}] Rule \`create\` function should return \`undefined\`, please use \`context.on()\` instead of return listeners.`);
		}

		return somlListeners.toEslintListeners();
	};
}
