'use strict';

const { constants } = require('../');

module.exports = () =>
{
	require('mocha-generators').install();

	return {
		scenes: [
			{
				scene: 'basic_lines',
				strategies: {
					basic: [ ],
				},
			},
			{
				scene: 'basic_choices',
				strategies: {
					option1: [ 1 ],
					option2: [ 2 ],
				},
			},
			{
				scene: 'basic_state',
				useAbsoluteAnswers: true,
				strategies: {
					option1_fail: [ 1, 2, 1 ],
					option2_fail: [ 2, 1, 2 ],
				},
			},
			{
				scene: 'state_maths',
				useAbsoluteAnswers: true,
				strategies: {
					fail5: [ 6, 5, 4, 3, 2, 1, 2 ],
					succeed1: [ 1, 2 ],
					succeed2: [ 1, 1, 3 ],
					succeed3: [ 1, 1, 1, 4 ],
					succeed4: [ 1, 1, 1, 1, 5 ],
					succeed5: [ 1, 1, 1, 1, 1, 6 ],
				},
			},
			{
				scene: 'nested_blocks',
				strategies: {
					l3o1: [ 1, 1, 1 ],
					l3o2: [ 1, 1, 2 ],
					l2o2: [ 1, 2 ],
					l1o2: [ 2 ],
				},
			},
			{ scene: 'goto_scene', extraScenes: [ 'blank_scene' ] },
			{ scene: 'block_not_found', error: constants.error.blockNotFound },
			{ scene: 'cast_not_found', error: constants.error.castNotFound },
			{ scene: 'scene_not_found', error: constants.error.sceneNotFound },
			{ scene: 'syntax_error', error: constants.error.syntaxError },
		],
		games: {
			basic: {
				strategies: {
					option1: [ 1 ],
					option2: [ 2 ],
					invalid_option: [ 3, 1 ],
				},
			},
			no_starting_scene: {
				expectedError: constants.error.startingSceneNotFound,
			},
			invalid_starting_scene: {
				expectedError: constants.error.startingSceneNotFound,
			},
		},
	};
};