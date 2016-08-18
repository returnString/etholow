'use strict';

const co = require('co');

class WebLoader
{
	constructor(gameUrl, playerOptions)
	{
		this.gameUrl = gameUrl;
		this.playerOptions = playerOptions;
		this.progressElem = document.getElementById("progress").firstElementChild;
	}

	updateDownloadProgress(percentage)
	{
		this.progressElem.textContent = `${percentage}% loaded... etholow v${etholow.constants.version}`;
	}

	*playAsync()
	{
		const game = new etholow.Game();
		
		this.updateDownloadProgress(0);
		const xhr = new XMLHttpRequest();
		yield new Promise((resolve, reject) =>
		{
			xhr.open('GET', this.gameUrl);
			xhr.addEventListener('error', reject);
			xhr.addEventListener('load', resolve);
			xhr.addEventListener('progress', (evt) =>
			{
				if (evt.lengthComputable)
				{
					this.updateDownloadProgress(evt.loaded / evt.total * 100);
				}
			});

			xhr.send();
		});

		const gameData = JSON.parse(xhr.responseText);

		this.progressElem.textContent += `, game v${gameData.version}`;

		game.loadData(gameData);
		yield game.run(new etholow.WebInterface(), this.playerOptions);
	}

	play()
	{
		co(this.playAsync.bind(this)).catch(err => console.error(err.stack));
	}
}

module.exports = WebLoader;