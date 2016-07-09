'use strict';

exports.deepCopyJSON = (obj) =>
{
	return JSON.parse(JSON.stringify(obj));
};

exports.merge = (dest, source) =>
{
	for (const prop in source)
	{
		dest[prop] = source[prop];
	}
};