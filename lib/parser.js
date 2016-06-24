'use strict';

const fs = require('fs');
const pegjs = require('pegjs');
const ParserError = require('./parser_error');
const errorCode = require('./error_code');

class Parser
{
	constructor(options = {})
	{
		this.options = options;
	}

	*init()
	{
		for (const grammar of [ 'scene', 'cast' ])
		{
			const grammarData = yield fs.readFileAsync(`${__dirname}/../grammars/${grammar}.pegjs`, 'utf8');
			this[`${grammar}Parser`] = pegjs.buildParser(grammarData);
		}
	}

	parseCast(castData)
	{
		return this.castParser.parse(castData);
	}

	parseGame(scenes, cast)
	{
		if (!cast)
		{
			throw new Error('No cast provided');
		}

		const sceneIDs = new Set(Object.keys(scenes));

		const ret = {};
		for (const sceneID in scenes)
		{
			const sceneData = scenes[sceneID];
			const ast = this.sceneParser.parse(sceneData);
			ret[sceneID] = ast;

			const blocks = ast.filter(n => n.type === 'block');
			const blockIDList = blocks.map(b => b.data.id);
			const blockIDs = new Set(blockIDList);

			const verifyNode = (node) =>
			{
				const currentNodeError = (code, message) =>
				{
					return new ParserError(node, sceneID, code, message);
				};

				const verifyBlockID = (node, blockID) =>
				{
					if (!blockIDs.has(blockID) && blockID !== 'exit')
					{
						throw currentNodeError(errorCode.blockNotFound, `Block ID "${blockID}" is invalid`);
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
					if (node.data.name && !cast[node.data.name])
					{
						throw currentNodeError(errorCode.castNotFound, `No cast entry found for "${node.data.name}"`);
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
						if (!sceneIDs.has(node.data.sceneID))
						{
							throw currentNodeError(errorCode.sceneNotFound, `Scene ID "${node.data.sceneID}" is invalid`);
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
					}
					break;

					default: throw currentNodeError(errorCode.sceneNotFound, `Unhandled node type: ${node.type}`);
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
				case 'choice': return recreateNode(node.data.target);
			}
		};

		return scene.map(b => recreateNode(b)).join('\n');
	}
}

module.exports = Parser;