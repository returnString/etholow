'use strict';

class ParserError extends Error
{
	constructor(scene, location, rawText, code, message)
	{
		const fullMessage = `E${code}: ${message} (scene: ${scene}, line ${location.start.line}: ${rawText})`;
		super(fullMessage);
		this.scene = scene;
		this.code = code;
	}
}

module.exports = ParserError;