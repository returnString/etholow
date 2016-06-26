#!/usr/bin/env node
'use strict';

const co = require('co');
const { Game } = require('../');

co(function*()
{
	const game = new Game(process.argv[2]);
	yield game.load();
	yield game.run();
}).catch(err => console.error(err.stack));