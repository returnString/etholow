'use strict';

const { Game } = require('../');
const path = require('path');
const co = require('co');
const assert = require('assert');

const gameConfig = {
	basic: {
		startingScene: 'scene1',
		strategies: {
			option1: [
				1,
			],
			option2: [
				2,
			],
			invalid_option: [
				3,
				1,
			],
		},
	},
};

function loadGame(gameName, startingScene, options = {})
{
	return new Game(path.join(__dirname, 'games', gameName), startingScene, options);
}

describe('game player', function()
{
	it('should throw an error when the starting scene does not exist', function(cb)
	{
		const game = loadGame('basic', 'nonexistent_scene');
		co(function*()
		{
			let caughtErr;
			try
			{
				yield game.run();
			}
			catch (err)
			{
				caughtErr = err;
			}

			assert.notEqual(caughtErr, null);
			return cb();
		}).catch(cb);
	});

	for (const gameName in gameConfig)
	{
		const gameData = gameConfig[gameName];
		describe(`playing '${gameName}'`, function()
		{
			for (const strategyName in gameData.strategies)
			{
				const strategy = gameData.strategies[strategyName];

				it(`using the '${strategyName} strategy'`, function(cb)
				{
					let readLineCalls = 0;
					const game = loadGame(gameName, gameData.startingScene, {
						readLineCallback: () => strategy[readLineCalls++],
						lineDelay: 0,
						suppressOutput: true,
					});

					co(function*()
					{
						yield game.run();
						assert.equal(readLineCalls, strategy.length);
						return cb();
					}).catch(cb);
				});
			}
		});
	}
});