'use strict';

const Parser = require('./parser');
const Player = require('./player');
const path = require('path');
const fs = require('fs');
const constants = require('./constants');
const EtholowError = require('./error');

class Game
{
	constructor(gameDir, playerOptions)
	{
		this.gameDir = gameDir;
		this.parser = new Parser();
		this.playerOptions = playerOptions;
	}

	*load()
	{
		yield this.parser.init();
		const sceneDir = path.join(this.gameDir, 'scenes');
		const scenes = {};
		const filenames = yield fs.readdirAsync(sceneDir);
		for (const filename of filenames.filter(f => path.extname(f) === constants.exts.scene))
		{
			scenes[filename.split('.')[0]] = yield fs.readFileAsync(path.join(sceneDir, filename), 'utf8');
		}

		const castData = yield fs.readFileAsync(path.join(this.gameDir, 'cast' + constants.exts.config), 'utf8');
		const cast = this.parser.parseConfig(castData);
		const sceneMap = this.parser.parseGame(scenes, cast);

		const configData = yield fs.readFileAsync(path.join(this.gameDir, 'config' + constants.exts.config), 'utf8');
		const config = this.parser.parseConfig(configData);
		if (!config.startingScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, 'No starting scene provided');
		}

		this.player = new Player(sceneMap, config.startingScene, cast, this.playerOptions);
	}

	*run()
	{
		yield this.player.run();
	}
}

module.exports = Game;