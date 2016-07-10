'use strict';

/* global process */

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
		WebInterface: require('./lib/web/web_interface'),
		WebLoader: require('./lib/web/web_loader'),
	};

	utils.merge(module.exports, browserExports);
}
else
{
	const nodeOnlyExports = {
		ReadlineInterface: require('./lib/node/readline_interface'),
	};

	utils.merge(module.exports, nodeOnlyExports);
}