'use strict';

const bluebird = require('bluebird');

for (const module of [ require('fs') ])
{
	bluebird.promisifyAll(module);
}

module.exports = {
	Player: require('./lib/player'),
	Parser: require('./lib/parser'),
	ParserError: require('./lib/parser_error'),
	Game: require('./lib/game'),

	errorCode: require('./lib/error_code'),
	constants: require('./lib/constants'),
};