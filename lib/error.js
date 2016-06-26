'use strict';

class EtholowError extends Error
{
	constructor(code, message)
	{
		super(`E${code}: ${message}`);
		this.code = code;
	}
}

module.exports = EtholowError;