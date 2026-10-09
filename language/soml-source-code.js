import {
	TextSourceCodeBase,
	VisitNodeStep,
	ConfigCommentParser,
	Directive,
} from '@eslint/plugin-kit';
import {visitorKeys} from 'soml-lang';

/**
@import {DirectiveType, FileProblem, RulesConfig, SourceLocation} from '@eslint/core';
@import {DocumentNode, Node, Token, Comment} from 'soml-lang';
*/

const commentParser = new ConfigCommentParser();
const INLINE_CONFIG = /^\s*eslint(?:-enable|-disable(?:(?:-next)?-line)?)?(?:\s|$)/v;
const RULE_CONFIG = /^\s*eslint(?:\s|$)/v;
// What separates a directive from its justification, as ESLint splits it.
const JUSTIFICATION = /\s-{2,}\s/v;

/*
Whether a comment is a directive. A `#` comment is the usual comment style, so one that starts with `eslint` in prose, as in `# eslint version to install`, is not a rule configuration. A rule configuration always has a `:`, so a `#` comment without one before its justification is not a directive.
*/
const isInlineConfig = comment => INLINE_CONFIG.test(comment.value)
	&& !(comment.type === 'Line' && RULE_CONFIG.test(comment.value) && !comment.value.split(JUSTIFICATION, 1)[0].includes(':'));

const isComment = item => item.type === 'Line' || item.type === 'Block';

/*
Merges the tokens and the comments, which are each in source order, into one list in source order. A merge takes linear time, where a sort would not.
*/
function mergeByStart(tokens, comments) {
	const items = [];
	let commentIndex = 0;

	for (const token of tokens) {
		while (commentIndex < comments.length && comments[commentIndex].range[0] < token.range[0]) {
			items.push(comments[commentIndex++]);
		}

		items.push(token);
	}

	while (commentIndex < comments.length) {
		items.push(comments[commentIndex++]);
	}

	return items;
}

/**
The source code of a SOML document, which rules get as `context.sourceCode`.
*/
export default class SomlSourceCode extends TextSourceCodeBase {
	/**
	@type {VisitNodeStep[] | undefined}
	*/
	#steps;
	#parents = new WeakMap();
	/**
	Every token and comment, in source order.

	@type {Array<Token | Comment>}
	*/
	#items;
	/**
	@type {Comment[] | undefined}
	*/
	#inlineConfigComments;
	/**
	Where each line starts, found once, when it is first needed.

	@type {number[] | undefined}
	*/
	#lineStarts;
	/**
	@type {DocumentNode}
	*/
	ast;
	visitorKeys = visitorKeys;
	/**
	Marks the source code as SOML, so a rule that works on several languages can tell, as `eslint-plugin-yml` and `eslint-plugin-toml` do with `isYAML` and `isTOML`.
	*/
	parserServices = {isSOML: true};

	/**
	@param {{text: string, ast: DocumentNode}} options
	*/
	constructor({text, ast}) {
		// SOML has no carriage returns, so a line ends only at a line feed.
		super({text, ast, lineEndingPattern: /\n/v});
		this.ast = ast;
		this.#items = mergeByStart(ast.tokens, ast.comments);
	}

	/*
	The index of the first token or comment that starts at or after `offset`. They never overlap, so their ends are in order too.
	*/
	#indexAt(offset) {
		const items = this.#items;
		let low = 0;
		let high = items.length;

		while (low < high) {
			const middle = Math.floor((low + high) / 2);

			if (items[middle].range[0] < offset) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}

		return low;
	}

	/*
	Moves from `index` by `step` until it finds a token, or a comment when they are included. Returns `null` when there is none, like ESLint's own `SourceCode`, so rules can use the usual `=== null` check.
	*/
	#find(index, step, includeComments, isInside = () => true) {
		for (; index >= 0 && index < this.#items.length; index += step) {
			const item = this.#items[index];

			if (!isInside(item)) {
				return null;
			}

			if (includeComments || !isComment(item)) {
				return item;
			}
		}

		return null;
	}

	/**
	The offsets where each line starts, shared by both location conversions.

	@returns {number[]}
	*/
	#getLineStarts() {
		if (!this.#lineStarts) {
			this.#lineStarts = [0];

			for (let lineFeed = this.text.indexOf('\n'); lineFeed !== -1; lineFeed = this.text.indexOf('\n', lineFeed + 1)) {
				this.#lineStarts.push(lineFeed + 1);
			}
		}

		return this.#lineStarts;
	}

	/**
	The 1-based line and 0-based column of an offset.

	This replaces the method of `TextSourceCodeBase`, which searches the rest of the text for a line feed again for every offset on the last line of a file with no line feed at the end, so a rule with many problems on that line takes quadratic time.

	@param {number} index
	@returns {{line: number, column: number}}
	*/
	getLocFromIndex(index) {
		if (typeof index !== 'number') {
			throw new TypeError('Expected `index` to be a number.');
		}

		if (index < 0 || index > this.text.length) {
			throw new RangeError(`Index out of range (requested index ${index}, but source text has length ${this.text.length}).`);
		}

		// The last line that starts at or before `index`.
		const lineStarts = this.#getLineStarts();
		let low = 0;
		let high = lineStarts.length - 1;

		while (low < high) {
			const middle = Math.ceil((low + high) / 2);

			if (lineStarts[middle] <= index) {
				low = middle;
			} else {
				high = middle - 1;
			}
		}

		return {line: low + 1, column: index - lineStarts[low]};
	}

	/**
	The offset of a 1-based line and 0-based column. Use the cached line starts so repeated locations on the last line do not search for a line feed again.

	@param {{line: number, column: number}} location
	@returns {number}
	*/
	getIndexFromLoc(location) {
		if (location === null || typeof location !== 'object' || typeof location.line !== 'number' || typeof location.column !== 'number') {
			throw new TypeError('Expected `loc` to be an object with numeric `line` and `column` properties.');
		}

		const lineStarts = this.#getLineStarts();
		if (location.line < 1 || location.line > lineStarts.length) {
			throw new RangeError(`Line number out of range (line ${location.line} requested). Valid range: 1-${lineStarts.length}`);
		}

		const lineStartIndex = lineStarts[location.line - 1];
		const isLastLine = location.line === lineStarts.length;
		const lineEndIndex = isLastLine ? this.text.length : lineStarts[location.line];
		const positionIndex = lineStartIndex + location.column;

		if (location.column < 0 || (isLastLine ? positionIndex > lineEndIndex : positionIndex >= lineEndIndex)) {
			throw new RangeError(`Column number out of range (column ${location.column} requested). Valid range for line ${location.line}: 0-${lineEndIndex - lineStartIndex + (isLastLine ? 0 : -1)}`);
		}

		return positionIndex;
	}

	/**
	@returns {Iterable<VisitNodeStep>}
	*/
	traverse() {
		if (this.#steps) {
			return this.#steps;
		}

		const steps = [];
		const parents = this.#parents;

		const visit = (node, parent) => {
			if (parent) {
				parents.set(node, parent);
			}

			steps.push(new VisitNodeStep({target: node, phase: 1, args: [node, parent]}));

			for (const key of visitorKeys[node.type]) {
				const child = node[key];

				if (Array.isArray(child)) {
					for (const item of child) {
						visit(item, node);
					}
				} else {
					visit(child, node);
				}
			}

			steps.push(new VisitNodeStep({target: node, phase: 2, args: [node, parent]}));
		};

		visit(this.ast);
		this.#steps = steps;
		return steps;
	}

	/**
	@param {Node} node
	@returns {Node | undefined}
	*/
	getParent(node) {
		// The parents are recorded by the first traversal.
		this.traverse();
		return this.#parents.get(node);
	}

	// When ESLint ships https://github.com/eslint/rfcs/pull/150, add a `comments` property holding `this.ast.comments` and use it in the rules. The new API deprecates `getAllComments()` and enables `no-irregular-whitespace` across languages.

	/**
	@returns {readonly Comment[]}
	*/
	getAllComments() {
		return this.ast.comments;
	}

	/**
	@returns {Comment[]}
	*/
	getInlineConfigNodes() {
		this.#inlineConfigComments ??= this.ast.comments.filter(comment => isInlineConfig(comment));
		return this.#inlineConfigComments;
	}

	/**
	@returns {{problems: FileProblem[], directives: Directive[]}}
	*/
	getDisableDirectives() {
		const problems = [];
		const directives = [];

		for (const comment of this.getInlineConfigNodes()) {
			const {label, value, justification} = commentParser.parseDirective(comment.value);

			// An `eslint-disable-line` comment may not span lines, because it would be unclear which line it applies to.
			if (label === 'eslint-disable-line' && comment.loc.start.line !== comment.loc.end.line) {
				problems.push({
					ruleId: null,
					message: `${label} comment should not span multiple lines.`,
					loc: comment.loc,
				});
				continue;
			}

			if (label !== 'eslint') {
				directives.push(new Directive({
					type: /** @type {DirectiveType} */ (label.slice('eslint-'.length)),
					node: comment,
					value,
					justification,
				}));
			}
		}

		return {problems, directives};
	}

	/**
	@returns {{problems: FileProblem[], configs: Array<{config: {rules: RulesConfig}, loc: SourceLocation}>}}
	*/
	applyInlineConfig() {
		const problems = [];
		const configs = [];

		for (const comment of this.getInlineConfigNodes()) {
			const {label, value} = commentParser.parseDirective(comment.value);

			if (label !== 'eslint') {
				continue;
			}

			const result = commentParser.parseJSONLikeConfig(value);

			if (result.ok) {
				configs.push({config: {rules: result.config}, loc: comment.loc});
			} else {
				problems.push({
					ruleId: null,
					message: result.error.message,
					loc: comment.loc,
				});
			}
		}

		return {configs, problems};
	}

	/**
	The token before a node, token, or comment.

	@param {Node | Token | Comment} nodeOrToken
	@param {{includeComments?: boolean}} [options]
	@returns {Token | Comment | null}
	*/
	getTokenBefore(nodeOrToken, {includeComments = false} = {}) {
		return this.#find(this.#indexAt(nodeOrToken.range[0]) - 1, -1, includeComments);
	}

	/**
	The token after a node, token, or comment.

	@param {Node | Token | Comment} nodeOrToken
	@param {{includeComments?: boolean}} [options]
	@returns {Token | Comment | null}
	*/
	getTokenAfter(nodeOrToken, {includeComments = false} = {}) {
		return this.#find(this.#indexAt(nodeOrToken.range[1]), 1, includeComments);
	}

	/**
	The first token inside a node.

	@param {Node} node
	@param {{includeComments?: boolean}} [options]
	@returns {Token | Comment | null}
	*/
	getFirstToken(node, {includeComments = false} = {}) {
		return this.#find(this.#indexAt(node.range[0]), 1, includeComments, item => item.range[1] <= node.range[1]);
	}

	/**
	The last token inside a node.

	@param {Node} node
	@param {{includeComments?: boolean}} [options]
	@returns {Token | Comment | null}
	*/
	getLastToken(node, {includeComments = false} = {}) {
		return this.#find(this.#indexAt(node.range[1]) - 1, -1, includeComments, item => item.range[0] >= node.range[0]);
	}

	/**
	Every token inside a node, in source order.

	@param {Node} node
	@param {{includeComments?: boolean}} [options]
	@returns {Array<Token | Comment>}
	*/
	getTokens(node, {includeComments = false} = {}) {
		const tokens = this.#items.slice(this.#indexAt(node.range[0]), this.#indexAt(node.range[1]));
		return includeComments ? tokens : tokens.filter(item => !isComment(item));
	}
}
