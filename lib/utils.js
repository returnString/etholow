'use strict';

exports.deepCopyJSON = (obj) =>
{
	return JSON.parse(JSON.stringify(obj));
};