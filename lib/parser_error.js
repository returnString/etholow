'use strict';

class ParserError extends Error
{
	constructor(node, code, message)
	{
		const fullMessage = `E${code}: ${message} (line ${node.debug.location.start.line}: ${node.debug.raw})`;
		super(fullMessage);
		this.node = node;
		this.code = code;
	}
}

module.exports = ParserError;