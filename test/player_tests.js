'use strict';

require('./test_setup')();
const { Game, constants, EtholowError } = require('../');
const path = require('path');
const assert = require('assert');

const gameConfig = {
	basic: {
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
	no_starting_scene: {
		expectedError: constants.error.startingSceneNotFound,
	},
	invalid_starting_scene: {
		expectedError: constants.error.startingSceneNotFound,
	},
};

function loadGame(gameName, options = {})
{
	return new Game(path.join(__dirname, 'games', gameName), options);
}

describe('game player', function()
{
	for (const gameName in gameConfig)
	{
		const gameData = gameConfig[gameName];
		describe(`playing '${gameName}'`, function()
		{
			if (gameData.expectedError)
			{
				it(`should throw error ${gameData.expectedError}`, function*()
				{
					let caughtErr;
					const game = loadGame(gameName);
					try
					{
						yield game.load();
						yield game.run();
					}
					catch (err)
					{
						caughtErr = err;
					}

					assert.notEqual(caughtErr, null);
					assert(caughtErr instanceof EtholowError, `Got error of type ${typeof caughtErr}: ${caughtErr.message}`);
					assert.equal(caughtErr.code, gameData.expectedError);
				});
			}
			else
			{
				for (const strategyName in gameData.strategies)
				{
					const strategy = gameData.strategies[strategyName];

					it(`using the '${strategyName} strategy'`, function*()
					{
						let readLineCalls = 0;
						const game = loadGame(gameName, {
							readLineCallback: () => strategy[readLineCalls++],
							lineDelay: 0,
							suppressOutput: true,
						});

						yield game.load();
						yield game.run();
						assert.equal(readLineCalls, strategy.length);
					});
				}
			}
		});
	}
});