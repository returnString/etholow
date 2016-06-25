'use strict';

const { Game } = require('../');
const path = require('path');
const co = require('co');

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
		},
	},
};

describe('game player', function()
{
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
					const game = new Game(path.join(__dirname, 'games', gameName), gameData.startingScene, {
						readLineCallback: () => strategy[readLineCalls++],
						lineDelay: 0,
						suppressOutput: true,
					});

					co(function*()
					{
						yield game.run();
						return cb();
					}).catch(cb);
				});
			}
		});
	}
});