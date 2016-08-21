'use strict';

const config = require('./test_setup')();
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Parser, EtholowError, constants } = require('../');

const defaultCast = {
	_: 'Narrator',
	person: 'Person',
};

const sceneDir = path.join(__dirname, 'scenes');
function loadSceneData(scene)
{
	return fs.readFileSync(path.join(sceneDir, `${scene}${constants.exts.scene}`), 'utf8').replace(/\r\n/g, '\n');
}

describe('Scene parser', function()
{
	function runTests(name, parserOptions)
	{
		const parser = new Parser(parserOptions);
		describe(`parser options '${name}'`, function()
		{
			it('should throw an error when no config is provided', function()
			{
				assert.throws(() => parser.parseGame([], null), err => err instanceof EtholowError && err.code === constants.error.configNotFound);
			});

			it('should throw an error when no cast is provided', function()
			{
				assert.throws(() => parser.parseGame([], { }), err => err instanceof EtholowError && err.code === constants.error.castNotFound);
			});

			for (const test of config.scenes)
			{
				let testName = `should process scene "${test.scene}"`;
				if (test.error)
				{
					testName += ` with error "${constants.errorNames[test.error]}"`;
				}

				it(testName, function()
				{
					let sceneList = [ test.scene ];
					if (test.extraScenes)
					{
						sceneList = sceneList.concat(test.extraScenes);
					}

					const scenes = {};
					for (const scene of sceneList)
					{
						scenes[scene] = loadSceneData(scene);
					}

					let parsedScenes, caughtErr;
					try
					{
						parsedScenes = parser.parseGame(scenes, { cast: defaultCast });
					}
					catch (err)
					{
						caughtErr = err;
					}

					if (test.error)
					{
						assert.notEqual(caughtErr, null);
						assert(caughtErr instanceof EtholowError);
						assert.equal(constants.errorNames[caughtErr.code], constants.errorNames[test.error]);
						assert.equal(caughtErr.scene, test.scene);
					}
					else
					{
						assert.ifError(caughtErr);
						const scene = parsedScenes[test.scene];
						const normalise = (str) => str.split('\n').map(l => l.trim()).join('\n');
						const recreatedText = parser.recreateText(scene);
						assert.equal(normalise(recreatedText), normalise(scenes[test.scene]));
					}
				});
			}
		});
	}

	runTests('no options specified', {});
	runTests('retain debug info', { retainDebugInfo: true });
});