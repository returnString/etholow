'use strict';

/* eslint-env browser */

class WebInterface
{
	init(playerOptions)
	{
		this.playerOptions = playerOptions;
	}

	*showLine(speaker, line)
	{
		const logDiv = document.getElementById("log");
		const newElement = document.createElement("p");

		if (speaker)
		{
			newElement.textContent = `${speaker}: `;
		}
		
		newElement.textContent += line;
		logDiv.appendChild(newElement);
		yield new Promise((resolve) => setTimeout(resolve, this.playerOptions.lineDelay));
	}

	*showChoice(choices)
	{
		const choiceDiv = document.getElementById("choices");
		return yield new Promise((resolve) =>
		{
			for (let i = 0; i < choices.length; i++)
			{
				const visualIndex = i + 1;
				const newElement = document.createElement("p");

				newElement.textContent = `${visualIndex}: ${choices[i]}`;
				newElement.addEventListener('click', () =>
				{
					while (choiceDiv.hasChildNodes())
					{
						choiceDiv.removeChild(choiceDiv.lastChild);
					}

					resolve(visualIndex);
				});

				choiceDiv.appendChild(newElement);
			}
		});
	}

	*showGameOver()
	{
		yield this.showLine(null, 'Game over!');
	}
}

module.exports = WebInterface;