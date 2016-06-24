'use strict';

class ParserError extends Error
{
	constructor(node, scene, code, message)
	{
		const fullMessage = `E${code}: ${message} (scene: ${scene}, line ${node.debug.location.start.line}: ${node.debug.raw})`;
		super(fullMessage);
		this.node = node;
		this.scene = scene;
		this.code = code;
	}
}

module.exports = ParserError;