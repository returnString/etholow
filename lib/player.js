'use strict';

const readline = require('readline');
const EtholowError = require('./error');
const constants = require('./constants');

class Player
{
	constructor(sceneMap, startingScene, cast, options = {
		lineDelay: 1000,
	})
	{
		this.sceneMap = sceneMap;
		this.startingScene = startingScene;
		this.cast = cast;
		this.rl = readline.createInterface({
			input: process.stdin,
			output: !options.suppressOutput ? process.stdout : null,
			historySize: 0,
		});
		this.options = options;
	}

	*showLine(speaker, line)
	{
		if (speaker)
		{
			this.rl.write(`${speaker}: `);
		}
		this.rl.write(`${line}\n`);
		return new Promise((resolve) =>
		{
			setTimeout(resolve, this.options.lineDelay);
			this.rl.once('line', resolve);
		});
	}

	*readLine()
	{
		// istanbul ignore else
		if (this.options.readLineCallback)
		{
			return this.options.readLineCallback();
		}
		else
		{
			return new Promise((resolve) => this.rl.once('line', resolve));
		}
	}

	*handleGoto(node)
	{
		switch (node.type)
		{
			case 'gotoScene':
			{
				return yield this.processScene(node.data.sceneID);
			}
			case 'gotoBlock':
			{
				if (node.data.blockID === 'exit')
				{
					this.rl.write('Game over.\n');
					this.rl.close();
					return;
				}

				return yield this.processBlock(this.currentScene[node.data.blockIndex]);
			}
			
			// istanbul ignore next
			default: throw new Error(`Unhandled target type: ${node.type}`);
		}
	}

	*processBlock(block)
	{
		for (const node of block.data.entries)
		{
			switch (node.type)
			{
				case 'line':
				{
					yield this.showLine(this.cast[node.data.name], node.data.line);
				}
				break;

				case 'choiceList':
				{
					while (true)
					{
						for (let i = 0; i < node.data.choices.length; i++)
						{
							const choice = node.data.choices[i];
							this.rl.write(`(${i + 1}) ${choice.data.desc}\n`);
						}
					
						this.rl.prompt();
						const selection = yield this.readLine();
						const parsed = parseInt(selection, 10);
						if (isNaN(parsed) || parsed <= 0 || parsed > node.data.choices.length)
						{
							this.rl.write(`"${selection}" is not a valid option. Please select from the available choices:\n`);
							continue;
						}

						const target = node.data.choices[parsed - 1].data.target;
						return yield this.handleGoto(target);
					}
				}

				case 'gotoBlock':
				case 'gotoScene':
				{
					return yield this.handleGoto(node);
				}

				// istanbul ignore next
				default: throw new Error(`Unhandled node type: ${node.type}`);
			}
		}
	}

	*processScene(sceneName)
	{
		this.currentScene = this.sceneMap[sceneName];
		if (!this.currentScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, `Scene "${sceneName}" does not exist`);
		}

		const startBlock = this.currentScene[0];
		yield this.processBlock(startBlock);
	}

	*run()
	{
		yield this.processScene(this.startingScene);
	}
}

module.exports = Player;