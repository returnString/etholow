'use strict';

function reverseMap(obj)
{
	const ret = {};
	for (const prop in obj)
	{
		ret[obj[prop]] = prop;
	}
	return ret;
}

const error = {
	invalidNodeType: 1,
	blockNotFound: 2,
	castNotFound: 3,
	sceneNotFound: 4,
	syntaxError: 5,
	startingSceneNotFound: 6,
	configNotFound: 7,
};

const exts = {
	scene: '.esf',
	config: '.json',
};

module.exports = {
	exts,
	error,
	errorNames: reverseMap(error),
};