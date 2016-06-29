'use strict';

const config = require('./test_setup')();
const { Game, constants, EtholowError } = require('../');
const path = require('path');
const assert = require('assert');

function *runStrategy(game, strategy, playerOptions)
{
	let readLineCalls = 0;

	const options = {
		readLineCallback: () => strategy[readLineCalls++],
		lineDelay: 0,
		suppressOutput: true,
	};

	for (const prop in playerOptions)
	{
		options[prop] = playerOptions[prop];
	}

	yield game.run(options);
	assert.equal(readLineCalls, strategy.length);
}

describe('game player', function()
{
	function testGame(gameName)
	{
		const gameData = config.games[gameName];
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

					describe(`using the '${strategyName} strategy`, function()
					{
						it('from the game dir', function*()
						{
							yield runStrategy(rawGame, strategy);
						});

						it('from the compiled json', function*()
						{
							yield runStrategy(compiledGame, strategy);
						});
					});
				}
			}
		});
	}

	for (const gameName in config.games)
	{
		testGame(gameName);
	}

	for (const test of config.scenes.filter(s => !s.error))
	{
		describe(`should process the standalone scene '${test.scene}'`, function()
		{
			let game;
			before(function*()
			{
				game = new Game();
				const scenePath = path.join(__dirname, 'scenes', `${test.scene}${constants.exts.scene}`);
				yield game.loadScene(scenePath);
			});

			for (const strategyName in test.strategies)
			{
				const strategy = test.strategies[strategyName];
				it(`using the '${strategyName}' strategy`, function*()
				{
					yield runStrategy(game, strategy, { useAbsoluteAnswers: test.useAbsoluteAnswers });
				});
			}
		});
	}
});