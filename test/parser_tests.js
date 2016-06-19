'use strict';

const co = require('co');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Parser, ParserError, errorCode, constants } = require('../');
const parser = new Parser();

const defaultCast = {
	_: 'Narrator',
	person: 'Person',
};

const testConfig = [
	{
		scene: 'basic_lines',
	},
	{
		scene: 'block_not_found',
		error: errorCode.blockNotFound,
	},
	{
		scene: 'cast_not_found',
		error: errorCode.castNotFound,
	},
	{
		scene: 'scene_not_found',
		error: errorCode.sceneNotFound,
	},
];

describe('Scene parser', function()
{
	before(function(cb)
	{
		co(function*()
		{
			yield parser.init();
			return cb();
		}).catch(cb);
	});

	const sceneDir = path.join(__dirname, 'scenes/');

	for (const test of testConfig)
	{
		let testName = `should process scene "${test.scene}"`;
		if (test.error)
		{
			testName += ` with error ${test.error}`;
		}

		it(testName, function()
		{
			const sceneData = fs.readFileSync(path.join(sceneDir, `${test.scene}${constants.exts.scene}`), 'utf8').replace(/\r\n/g, '\n');
			
			let parsedScenes, caughtErr;
			try
			{
				parsedScenes = parser.parseGame({ scene1: sceneData }, defaultCast);
			}
			catch (err)
			{
				caughtErr = err;
			}

			if (test.error)
			{
				assert.notEqual(caughtErr, null);
				assert(caughtErr instanceof ParserError);
				assert.equal(caughtErr.code, test.error);
			}
			else
			{
				assert.equal(caughtErr, null);
				const { scene1 } = parsedScenes;
				const recreatedText = parser.recreateText(scene1);
				assert.equal(sceneData, recreatedText);
			}
		});
	}
});