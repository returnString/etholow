'use strict';

const readline = require('readline');

class ReadlineInterface
{
	constructor(options = {
		suppressOutput: false,
	})
	{
		this.rl = readline.createInterface({
			input: process.stdin,
			output: !options.suppressOutput ? process.stdout : null,
			historySize: 0,
		});
	}

	init(playerOptions)
	{
		this.playerOptions = playerOptions;
	}

	*showLine(speaker, line)
	{
		if (speaker)
		{
			this.rl.write(`${speaker}: `);
		}
		this.rl.write(`${line}\n`);
		return new Promise((resolve) =>
		{
			setTimeout(resolve, this.playerOptions.lineDelay);
			this.rl.once('line', resolve);
		});
	}

	*readLine()
	{
		return new Promise((resolve) => this.rl.once('line', resolve));
	}

	*getAnswer()
	{
		const answer = yield this.readLine();
		const parsed = parseInt(answer, 10);
		return { answer, parsed };
	}

	*showChoice(choices, availableChoiceCount)
	{
		while (true)
		{
			for (let i = 0; i < choices.length; i++)
			{
				const choice = choices[i];
				this.rl.write(`(${i + 1}) ${choice}\n`);
			}

			this.rl.prompt();
			const { answer, parsed } = yield this.getAnswer();

			if (isNaN(parsed) || parsed <= 0 || parsed > availableChoiceCount)
			{
				this.rl.write(`"${answer}" is not a valid option. Please select from the available choices:\n`);
				continue;
			}

			return answer;
		}
	}

	*showGameOver()
	{
		this.rl.write('Game over.\n');
		this.rl.close();
	}
}

module.exports = ReadlineInterface;