'use strict';

const fs = require('fs');
const pegjs = require('pegjs');
const EtholowError = require('./error');
const constants = require('./constants');

class Parser
{
	constructor(options = {})
	{
		this.options = options;
	}

	*init()
	{
		for (const grammar of [ 'scene', 'config' ])
		{
			const grammarData = yield fs.readFileAsync(`${__dirname}/../grammars/${grammar}.pegjs`, 'utf8');
			this[`${grammar}Parser`] = pegjs.buildParser(grammarData);
		}
	}

	parseConfig(configData)
	{
		return this.configParser.parse(configData);
	}

	parseGame(scenes, cast)
	{
		if (!cast)
		{
			throw new EtholowError(constants.error.castNotFound, 'No cast provided');
		}

		const sceneIDs = new Set(Object.keys(scenes));

		const ret = {};
		for (const sceneID in scenes)
		{
			const sceneData = scenes[sceneID];

			const currentSceneError = (code, location, rawText, message) =>
			{
				const err = new EtholowError(code, `${message} (scene: ${sceneID}, line ${location.start.line}: ${rawText})`);
				err.scene = sceneID;
				return err;
			};

			let ast;
			try
			{
				ast = this.sceneParser.parse(sceneData);
			}
			catch (err)
			{
				throw currentSceneError(constants.error.syntaxError, err.location, err.found, err.message);
			}

			ret[sceneID] = ast;

			const blocks = ast.filter(n => n.type === 'block');
			const blockIDList = blocks.map(b => b.data.id);
			const blockIDs = new Set(blockIDList);

			const verifyNode = (node) =>
			{
				const currentNodeError = (code, message) => currentSceneError(code, node.debug.location, node.debug.raw, message);

				const verifyBlockID = (node, blockID) =>
				{
					if (!blockIDs.has(blockID) && blockID !== 'exit')
					{
						throw currentNodeError(constants.error.blockNotFound, `Block ID "${blockID}" is invalid`);
					}
				};

				switch (node.type)
				{
					case 'block':
					{
						for (const child of node.data.entries)
						{
							verifyNode(child);
						}
					}
					break;

					case 'line':
					if (!this.options.singleSceneMode && node.data.name && !cast[node.data.name])
					{
						throw currentNodeError(constants.error.castNotFound, `No cast entry found for "${node.data.name}"`);
					}
					break;

					case 'gotoBlock':
					{
						verifyBlockID(node, node.data.blockID);
						node.data.blockIndex = blockIDList.indexOf(node.data.blockID);
					}
					break;

					case 'gotoScene':
					{
						if (!this.options.singleSceneMode && !sceneIDs.has(node.data.sceneID))
						{
							throw currentNodeError(constants.error.sceneNotFound, `Scene ID "${node.data.sceneID}" is invalid`);
						}
					}
					break;

					case 'choiceList':
					{
						for (const choice of node.data.choices)
						{
							verifyNode(choice);
						}
					}
					break;

					case 'choice':
					{
						verifyNode(node.data.target);
						if (node.data.cond)
						{
							verifyNode(node.data.cond);
						}
					}
					break;

					// no verification needed
					case 'choiceConditional':
					case 'stateLiteral':
					case 'stateAssignment':
					case 'stateProperty':
					break;

					case 'stateBlock':
					{
						for (const expr of node.data.exprs)
						{
							verifyNode(expr);
						}
					}
					break;

					// istanbul ignore next
					default: throw currentNodeError(constants.error.invalidNodeType, `Unhandled node type: ${node.type}`);
				}

				if (this.options.stripDebugInfo)
				{
					delete node.debug;
				}
			};
			
			for (const block of blocks)
			{
				verifyNode(block);
			}
		}

		return ret;
	}

	recreateText(scene)
	{
		const recreateNode = function(node)
		{
			switch (node.type)
			{
				case 'block':
				{
					const header = `# ${node.data.id}`;
					const entries = node.data.entries.map(e => recreateNode(e));
					return [ header ].concat(entries).join('\n');
				}

				case 'line':
				{
					const prefix = node.data.name ? `${node.data.name}: ` : '';
					return `${prefix}"${node.data.line}"`;
				}
				
				case 'gotoBlock': return `=> ${node.data.blockID}`;
				case 'gotoScene': return `=> scene.${node.data.sceneID}`;
				case 'choiceList': return node.data.choices.map(c => recreateNode(c)).join('\n');
				case 'choiceConditional': return `? ${recreateNode(node.data.expr)}`;
				case 'choice':
				{
					let ret = `> "${node.data.desc}" ${recreateNode(node.data.target)}`;
					if (node.data.cond)
					{
						ret += ' ' + recreateNode(node.data.cond);
					}
					return ret;
				}

				case 'stateLiteral': return node.data.value;
				case 'stateProperty': return node.data.identChain.join('.');
				case 'stateAssignment': return `${recreateNode(node.data.prop)} = ${recreateNode(node.data.rhs)}`;
				case 'stateBlock': return `{\n${node.data.exprs.map(e => '\t' + recreateNode(e)).join('\n')}\n}`;
			}
		};

		return scene.map(b => recreateNode(b)).join('\n\n');
	}
}

module.exports = Parser;