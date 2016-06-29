'use strict';

require('./test_setup')();
const pegjs = require('pegjs');
const fs = require('fs');
const assert = require('assert');

const testData = {
	'1 + 1': {
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
	'scene.value + 1': {
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
	'scene.value == 1': {
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
	let parser;
	before(function*()
	{
		const grammarData = yield fs.readFileAsync(`${__dirname}/../grammars/scene.pegjs`, 'utf8');
		parser = pegjs.buildParser(grammarData, { allowedStartRules: [ 'StateExpression' ] });
	});

	function testExpr(expr)
	{
		const parsed = parser.parse(expr);
		nodeAssert(parsed, testData[expr]);
	}

	for (const expr in testData)
	{
		it(`should evaluate '${expr}'`, function()
		{
			testExpr(expr);
		});
	}
});