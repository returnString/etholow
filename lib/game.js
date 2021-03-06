'use strict';

const Parser = require('./parser');
const Player = require('./player');
const path = require('path');
const fs = require('fs');
const constants = require('./constants');
const EtholowError = require('./error');
const utils = require('./utils');

class Game
{
	*loadDir(gameDir)
	{
		const parser = new Parser();
		const sceneDir = path.join(gameDir, 'scenes');
		const scenes = {};
		const filenames = yield fs.readdirAsync(sceneDir);
		for (const filename of filenames.filter(f => path.extname(f) === constants.exts.scene))
		{
			scenes[path.basename(filename, constants.exts.scene)] = yield fs.readFileAsync(path.join(sceneDir, filename), 'utf8');
		}

		const configData = yield fs.readFileAsync(path.join(gameDir, 'config' + constants.exts.config), 'utf8');
		const config = JSON.parse(configData);
		const sceneMap = parser.parseGame(scenes, config);

		if (!config.startingScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, 'No starting scene provided');
		}

		this.data = {
			sceneMap,
			config,
			version: constants.version,
		};
	}

	*loadScene(sceneFile)
	{
		const sceneID = path.basename(sceneFile, constants.exts.scene);
		const scenes = {
			[sceneID]: yield fs.readFileAsync(sceneFile, 'utf8'),
		};

		const parser = new Parser({ singleSceneMode: true });
		const config = {
			startingScene: sceneID,
			cast: {},
		};

		const sceneMap = parser.parseGame(scenes, config);

		this.data = {
			sceneMap,
			config,
		};
	}

	*loadJson(gameFile)
	{
		const data = yield fs.readFileAsync(gameFile, 'utf8');
		this.data = JSON.parse(data);
	}

	copyData()
	{
		return utils.deepCopyJSON(this.data);
	}

	loadData(jsonData)
	{
		this.data = jsonData;
	}

	*saveJson(gameFile)
	{
		yield fs.writeFileAsync(gameFile, JSON.stringify(this.data), 'utf8');
	}

	*run(playerInterface, playerOptions)
	{
		const player = new Player(playerInterface, this.data.sceneMap, this.data.config.startingScene, this.data.config.cast, playerOptions);
		yield player.run();
	}
}

module.exports = Game;