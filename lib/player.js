'use strict';

const readline = require('readline');
const EtholowError = require('./error');
const constants = require('./constants');

class Player
{
	constructor(sceneMap, startingScene, cast, options = {
		lineDelay: 1000,
		useAbsoluteAnswers: false,
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

	*processNode(node, noResolve)
	{
		switch (node.type)
		{
			case 'line':
			{
				const speaker = node.data.name ? (this.cast[node.data.name] || `missing cast string (${node.data.name})`) : null;
				yield this.showLine(speaker, node.data.line);
			}
			break;

			case 'choiceConditional':
			{
				return yield this.processNode(node.data.expr);
			}

			case 'choiceList':
			{
				while (true)
				{
					let visualAnswers = [], absoluteAnswers = [];
					for (const choice of node.data.choices)
					{
						let available = true;
						if (choice.data.cond)
						{
							const condResult = yield this.processNode(choice.data.cond);
							available = !!condResult;
						}

						const answer = { choice, available };
						absoluteAnswers.push(answer);
						if (available)
						{
							const visualIndex = visualAnswers.length;
							this.rl.write(`(${visualIndex + 1}) ${choice.data.desc}\n`);
							visualAnswers.push(answer);
						}
					}

					this.rl.prompt();
					const selection = yield this.readLine();
					const parsed = parseInt(selection, 10);
					const answerSource = this.options.useAbsoluteAnswers ? absoluteAnswers : visualAnswers;
					if (isNaN(parsed) || parsed <= 0 || parsed > answerSource.length)
					{
						this.rl.write(`"${selection}" is not a valid option. Please select from the available choices:\n`);
						continue;
					}

					const answer = answerSource[parsed - 1];
					if (!answer.available)
					{
						continue;
					}
					
					return yield this.handleGoto(answer.choice.data.target);
				}
			}

			case 'gotoBlock':
			case 'gotoScene':
			{
				return yield this.handleGoto(node);
			}

			case 'stateBlock':
			{
				for (const expr of node.data.exprs)
				{
					yield this.processNode(expr);
				}
			}
			break;

			case 'stateProperty':
			{
				const [ stateType, ...idents ] = node.data.identChain;

				let section, field;
				switch (stateType)
				{
					case 'scene':
					section = this.state.scenes[this.currentSceneName];
					field = idents[0];
					break;

					// istanbul ignore next
					default: throw new Error(`Unhandled state type: ${stateType}`);
				}

				if (noResolve)
				{
					return {
						section,
						field,
					};
				}
				else
				{
					return section[field];
				}
			}

			case 'stateAssignment':
			{
				const lhs = yield this.processNode(node.data.prop, true);
				const rhs = yield this.processNode(node.data.rhs);
				lhs.section[lhs.field] = rhs;
				return rhs;
			}

			case 'stateLiteral': return node.data.value;

			// istanbul ignore next
			default: throw new Error(`Unhandled node type: ${node.type}`);
		}
	}

	*processBlock(block)
	{
		for (const node of block.data.entries)
		{
			yield this.processNode(node);
		}
	}

	*processScene(sceneName)
	{
		this.currentScene = this.sceneMap[sceneName];
		this.currentSceneName = sceneName;
		if (!this.currentScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, `Scene "${sceneName}" does not exist`);
		}

		const startBlock = this.currentScene[0];
		yield this.processBlock(startBlock);
	}

	*run()
	{
		this.state = { scenes: {} };
		for (const sceneID in this.sceneMap)
		{
			this.state.scenes[sceneID] = {};
		}

		yield this.processScene(this.startingScene);
	}
}

module.exports = Player;