'use strict';

const Parser = require('./parser');
const Player = require('./player');
const path = require('path');
const fs = require('fs');
const constants = require('./constants');
const EtholowError = require('./error');

class Game
{
	*loadDir(gameDir)
	{
		const parser = new Parser();
		yield parser.init();
		const sceneDir = path.join(gameDir, 'scenes');
		const scenes = {};
		const filenames = yield fs.readdirAsync(sceneDir);
		for (const filename of filenames.filter(f => path.extname(f) === constants.exts.scene))
		{
			scenes[filename.split('.')[0]] = yield fs.readFileAsync(path.join(sceneDir, filename), 'utf8');
		}

		const castData = yield fs.readFileAsync(path.join(gameDir, 'cast' + constants.exts.config), 'utf8');
		const cast = parser.parseConfig(castData);
		const sceneMap = parser.parseGame(scenes, cast);

		const configData = yield fs.readFileAsync(path.join(gameDir, 'config' + constants.exts.config), 'utf8');
		const config = parser.parseConfig(configData);

		if (!config.startingScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, 'No starting scene provided');
		}

		this.data = {
			cast,
			sceneMap,
			config,
		};
	}

	*loadJson(gameFile)
	{
		const data = yield fs.readFileAsync(gameFile, 'utf8');
		this.data = JSON.parse(data);
	}

	*saveJson(gameFile)
	{
		yield fs.writeFileAsync(gameFile, JSON.stringify(this.data), 'utf8');
	}

	*run(playerOptions)
	{
		const player = new Player(this.data.sceneMap, this.data.config.startingScene, this.data.cast, playerOptions);
		yield player.run();
	}
}

module.exports = Game;