#!/usr/bin/env node
'use strict';

const co = require('co');
const { Game, ReadlineInterface } = require('../');
const path = require('path');

const args = process.argv.slice(2);

function *loadGame(pathArgIndex)
{
	const target = args[pathArgIndex];
	if (!target) throw new Error('No game path provided');
	const parsed = path.parse(target);
	const game = new Game();

	switch (parsed.ext)
	{
		case '.json':
		yield game.loadJson(target);
		break;

		case '.esf':
		yield game.loadScene(target);
		break;
		
		default:
		yield game.loadDir(target);
		break;
	}
	return game;
}

const actions = {
	play: function*()
	{
		const game = yield loadGame(1);
		yield game.run(new ReadlineInterface(), game.data.config.playerOptions);
	},
	export: function*()
	{
		const game = yield loadGame(1);
		yield game.saveJson(args[2]);
	},
};

function *main()
{
	const action = args[0];
	const func = actions[action];
	if (!func) throw new Error(`'${action}' is not a valid action`);
	yield func();
}

co(main).catch(err => console.error(err.stack));