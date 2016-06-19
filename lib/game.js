'use strict';

const Parser = require('./parser');
const Player = require('./player');
const path = require('path');
const fs = require('fs');
const constants = require('./constants');

class Game
{
	constructor(gameDir, startingScene)
	{
		this.gameDir = gameDir;
		this.startingScene = startingScene;
		this.parser = new Parser();
	}

	*run()
	{
		yield this.parser.init();
		const sceneDir = path.join(this.gameDir, 'scenes');
		const scenes = {};
		const filenames = yield fs.readdirAsync(sceneDir);
		for (const filename of filenames.filter(f => path.extname(f) === constants.exts.scene))
		{
			scenes[filename.split('.')[0]] = yield fs.readFileAsync(path.join(sceneDir, filename), 'utf8');
		}

		const castData = yield fs.readFileAsync(path.join(this.gameDir, 'cast' + constants.exts.cast), 'utf8');
		const cast = this.parser.parseCast(castData);
		const sceneMap = this.parser.parseGame(scenes, cast);
		this.player = new Player(sceneMap, this.startingScene, cast);
		yield this.player.run();
	}
}

module.exports = Game;