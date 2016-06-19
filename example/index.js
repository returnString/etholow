'use strict';

const co = require('co');
const { Game } = require('../');

function *main()
{
	const game = new Game(__dirname, 'scene1');
	yield game.run();
}

co(main).catch(err => console.error(err.stack)); // eslint-disable-line no-console