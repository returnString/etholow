'use strict';

const { ReadlineInterface } = require('../');
const assert = require('assert');

class TestInterface extends ReadlineInterface
{
	constructor(strategy)
	{
		super({ suppressOutput: true });
		this.strategy = strategy;
		this.answerRequests = 0;
	}

	*getAnswer()
	{
		const answer = this.strategy[this.answerRequests++];
		assert(answer, `No answer provided for attempt ${this.answerRequests}`);
		return { answer, parsed: answer };
	}
}

module.exports = TestInterface;