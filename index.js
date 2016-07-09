'use strict';

const bluebird = require('bluebird');

for (const module of [ require('fs') ])
{
	bluebird.promisifyAll(module);
}

module.exports = {
	Player: require('./lib/player'),
	Parser: require('./lib/parser'),
	EtholowError: require('./lib/error'),
	Game: require('./lib/game'),

	ReadlineInterface: require('./lib/readline_interface'),

	constants: require('./lib/constants'),
};