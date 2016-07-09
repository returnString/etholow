'use strict';

const EtholowError = require('./error');
const constants = require('./constants');

class Player
{
	constructor(playerInterface, sceneMap, startingScene, cast, options = {
		lineDelay: 1000,
		useAbsoluteAnswers: false,
	})
	{
		this.interface = playerInterface;
		this.interface.init(options);

		this.sceneMap = sceneMap;
		this.startingScene = startingScene;
		this.cast = cast;
		this.options = options;
	}

	*handleGoto(node)
	{
		switch (node.type)
		{
			case 'gotoScene':
			{
				this.setCurrentScene(node.data.sceneID);
				return yield this.processCurrentScene();
			}
			case 'gotoBlock':
			{
				if (node.data.blockID === 'exit')
				{
					yield this.interface.showGameOver();
					return;
				}

				return yield this.processBlock(this.currentScene[node.data.blockIndex]);
			}
			
			// istanbul ignore next
			default: throw new Error(`Unhandled target type: ${node.type}`);
		}
	}

	processBinaryOp(op, lhs, rhs)
	{
		switch (op)
		{
			case '+': return lhs + rhs;
			case '-': return lhs - rhs;
			case '*': return lhs * rhs;
			case '/': return lhs / rhs;
			case '==': return lhs === rhs;
			case '&&': return lhs && rhs;
			case '||': return lhs || rhs;

			// istanbul ignore next
			default: throw new Error(`Unhandled binary operator: ${op}`);
		}
	}

	processUnaryOp(op, arg)
	{
		switch (op)
		{
			case '!': return !arg;

			// istanbul ignore next
			default: throw new Error(`Unhandled unary operator: ${op}`);
		}
	}

	*processNode(node, noResolve)
	{
		switch (node.type)
		{
			case 'line':
			{
				const speaker = node.data.name ? (this.cast[node.data.name] || `missing cast string (${node.data.name})`) : null;
				yield this.interface.showLine(speaker, node.data.line);
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
							visualAnswers.push(answer);
						}
					}

					const answerSource = this.options.useAbsoluteAnswers ? absoluteAnswers : visualAnswers;
					const selection = yield this.interface.showChoice(visualAnswers.map(a => a.choice.data.desc), answerSource.length);

					const answer = answerSource[selection - 1];
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

			case 'stateBinaryOp':
			{
				const lhs = yield this.processNode(node.data.lhs);
				const rhs = yield this.processNode(node.data.rhs);
				return this.processBinaryOp(node.data.op, lhs, rhs);
			}

			case 'stateUnaryOp':
			{
				const arg = yield this.processNode(node.data.arg);
				return this.processUnaryOp(node.data.op, arg);
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

	setCurrentScene(sceneName)
	{
		this.currentScene = this.sceneMap[sceneName];
		this.currentSceneName = sceneName;
		if (!this.currentScene)
		{
			throw new EtholowError(constants.error.startingSceneNotFound, `Scene "${sceneName}" does not exist`);
		}
	}

	*processCurrentScene()
	{
		const startBlock = this.currentScene[0];
		yield this.processBlock(startBlock);
	}

	initState()
	{
		this.state = { scenes: {} };
		for (const sceneID in this.sceneMap)
		{
			this.state.scenes[sceneID] = {};
		}
	}

	*run()
	{
		this.initState();
		this.setCurrentScene(this.startingScene);
		yield this.processCurrentScene();
	}
}

module.exports = Player;