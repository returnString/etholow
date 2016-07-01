'use strict';

require('./test_setup')();
const pegjs = require('pegjs');
const fs = require('fs');
const assert = require('assert');
const { Player } = require('../');

const testData = {
	'1 + 1': {
		value: 2,
		ast: {
			type: 'stateBinaryOp',
			data: {
				op: '+',
				lhs: {
					type: 'stateLiteral',
					data: {
						value: 1,
					},
				},
				rhs: {
					type: 'stateLiteral',
					data: {
						value: 1,
					},
				},
			},
		},
	},
	'scene.value + 1': {
		value: 1,
		initialSceneState: {
			value: 0,
		},
		ast: {
			type: 'stateBinaryOp',
			data: {
				op: '+',
				lhs: {
					type: 'stateProperty',
					data: {
						identChain: [ 'scene', 'value' ],
					},
				},
				rhs: {
					type: 'stateLiteral',
					data: {
						value: 1,
					},
				},
			},
		},
	},
	'scene.value == 1': {
		value: false,
		initialSceneState: {
			value: 0,
		},
		ast: {
			type: 'stateBinaryOp',
			data: {
				op: '==',
				lhs: {
					type: 'stateProperty',
					data: {
						identChain: [ 'scene', 'value' ],
					},
				},
				rhs: {
					type: 'stateLiteral',
					data: {
						value: 1,
					},
				},
			},
		},
	},
	'2 * 3 + 4': {
		value: 10,
	},
	'2 * (3 + 4)': {
		value: 14,
	},
	'10 / 5': {
		value: 2,
	},
	'30 - 10': {
		value: 20,
	},
	'!false': {
		value: true,
	},
	'!true': {
		value: false,
	},
	'!scene.undefined': {
		value: true,
	},
	'!scene.defined': {
		initialSceneState: {
			defined: true,
		},
		value: false,
	},
	'scene.defined == !scene.defined': {
		initialSceneState: {
			defined: true,
		},
		value: false,
	},
	'true && false': {
		value: false,
	},
	'false && true': {
		value: false,
	},
	'true || false': {
		value: true,
	},
	'false || true': {
		value: true,
	},
	'scene.true && scene.false': {
		initialSceneState: {
			true: true,
			false: false,
		},
		value: false,
	},
	'scene.false && scene.true': {
		initialSceneState: {
			true: true,
			false: false,
		},
		value: false,
	},
	'scene.true || scene.false': {
		initialSceneState: {
			true: true,
			false: false,
		},
		value: true,
	},
	'scene.false || scene.true': {
		initialSceneState: {
			true: true,
			false: false,
		},
		value: true,
	},
};

function nodeAssert(actual, expected, skipAssert = false)
{
	delete actual.debug;

	for (const prop in actual)
	{
		if (typeof actual[prop] === 'object')
		{
			nodeAssert(actual[prop], expected[prop], true);
		}
	}

	if (!skipAssert)
	{
		assert.deepEqual(actual, expected);
	}
}

describe('expression parsing', function()
{
	const exprSceneID = 'exprScene';
	let parser, player = new Player({ [exprSceneID]: {} }, exprSceneID, {});
	before(function*()
	{
		const grammarData = yield fs.readFileAsync(`${__dirname}/../grammars/scene.pegjs`, 'utf8');
		parser = pegjs.buildParser(grammarData, { allowedStartRules: [ 'StateExpression' ] });
	});

	function *testExpr(expr)
	{
		const test = testData[expr];
		const parsed = parser.parse(expr);
		if (test.ast)
		{
			nodeAssert(parsed, test.ast);
		}

		player.initState();
		const sceneState = player.state.scenes[exprSceneID];

		if (test.initialSceneState)
		{
			for (const prop in test.initialSceneState)
			{
				sceneState[prop] = test.initialSceneState[prop];	
			}
		}

		player.setCurrentScene(exprSceneID);
		const result = yield player.processNode(parsed);
		assert.strictEqual(result, test.value);
	}

	for (const expr in testData)
	{
		it(`should evaluate '${expr}'`, function*()
		{
			yield testExpr(expr);
		});
	}
});