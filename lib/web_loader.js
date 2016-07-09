'use strict';

/* eslint-env browser */
/* global etholow */
/* eslint-disable no-console */

const co = require('co');

function updateDownloadProgress(percentage)
{
	const progressDiv = document.getElementById("progress");
	const progressText = progressDiv.firstElementChild;
	progressText.textContent = `${percentage}% loaded...`;
}

module.exports = (gameUrl = 'compiled.json') =>
{
	co(function*()
	{
		const game = new etholow.Game();
	
		updateDownloadProgress(0);
		const xhr = new XMLHttpRequest();
		yield new Promise((resolve, reject) =>
		{
			xhr.open('GET', gameUrl);
			xhr.addEventListener('error', reject);
			xhr.addEventListener('load', resolve);
			xhr.addEventListener('progress', (evt) =>
			{
				if (evt.lengthComputable)
				{
					updateDownloadProgress(evt.loaded / evt.total * 100);
				}
			});

			xhr.send();
		});

		const gameData = JSON.parse(xhr.responseText);
		game.loadData(gameData);
		yield game.run(new etholow.WebInterface());
	}).catch(err => console.error(err.stack));
};