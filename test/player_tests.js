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

describe('game player', function()
{
	function testGame(gameName)
	{
		const gameData = gameConfig[gameName];
		describe(`playing '${gameName}'`, function()
		{
			const gameDir = path.join(__dirname, 'games', gameName);
			let rawGame, compiledGame;
			before(function*()
			{
				rawGame = new Game();
				compiledGame = new Game();

				if (!gameData.expectedError)
				{
					yield rawGame.loadDir(gameDir);
					yield rawGame.saveJson(path.join(gameDir, 'compiled.json'));
					yield compiledGame.loadJson(path.join(gameDir, 'compiled.json'));
				}
			});

			if (gameData.expectedError)
			{
				it(`should throw error ${gameData.expectedError}`, function*()
				{
					let caughtErr;
					try
					{
						yield rawGame.loadDir(gameDir);
						yield rawGame.run();
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

					const runStrategy = function*(game)
					{
						let readLineCalls = 0;
						yield game.run({
							readLineCallback: () => strategy[readLineCalls++],
							lineDelay: 0,
							suppressOutput: true,
						});
						assert.equal(readLineCalls, strategy.length);
					};

					describe(`using the '${strategyName} strategy`, function()
					{
						it('from the game dir', function*()
						{
							yield runStrategy(rawGame);
						});

						it('from the compiled json', function*()
						{
							yield runStrategy(compiledGame);
						});
					});
				}
			}
		});
	}

	for (const gameName in gameConfig)
	{
		testGame(gameName);
	}
});