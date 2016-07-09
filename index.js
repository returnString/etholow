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

module.exports = {
	Player: require('./lib/player'),
	Parser: require('./lib/parser'),
	EtholowError: require('./lib/error'),
	Game: require('./lib/game'),

	ReadlineInterface: require('./lib/interfaces/readline_interface'),
	WebInterface: require('./lib/interfaces/web_interface'),
	
	webLoader: require('./lib/web_loader'),

	constants: require('./lib/constants'),
};