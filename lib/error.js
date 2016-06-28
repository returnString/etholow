'use strict';

const assert = require('assert');
const constants = require('./constants');

class EtholowError extends Error
{
	constructor(code, message)
	{
		const errorName = constants.errorNames[code];
		assert(errorName, `Code '${code}' is not a valid etholow error code`);
		super(`E${code} (${errorName}): ${message}`);
		this.code = code;
	}
}

module.exports = EtholowError;