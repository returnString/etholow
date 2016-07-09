'use strict';

if (process.browser)
{
	require('babel-polyfill');
}
else
{
	const bluebird = require('bluebird');

	for (const module of [ require('fs') ])
	{
		bluebird.promisifyAll(module);
	}
}

const utils = require('./lib/utils');

module.exports = {
	Player: require('./lib/player'),
	Parser: require('./lib/parser'),
	EtholowError: require('./lib/error'),
	Game: require('./lib/game'),


	constants: require('./lib/constants'),
};

if (process.browser)
{
	const browserExports = {
		WebInterface: require('./lib/interfaces/web_interface'),
		webLoader: require('./lib/web_loader'),
	};

	utils.merge(module.exports, browserExports);
}
else
{
	const nodeOnlyExports = {
		ReadlineInterface: require('./lib/interfaces/readline_interface'),
	};

	utils.merge(module.exports, nodeOnlyExports);
}