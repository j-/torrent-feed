const database = require('./database');
const express = require('express');
const RSS = require('rss');
const app = express();

const PORT = process.env.PORT;
const HOST = `http://localhost:${PORT}`;

app.get('/:output.rss', (req, res) => {
	var output = req.params.output;
	var feed = new RSS({
		title: 'torrent-feed',
		description: 'Feed of torrents',
		site_url: `${HOST}/`,
		feed_url: `${HOST}/feed/${output}.rss`,
		generator: `${HOST}/`,
	});

	database.getAll(output).then((entries) => {
		var date;
		for (var entry of entries) {
			date = new Date(entry.created_date).toISOString();
			feed.item({
				title: `${date} (${entry.entry_id})`,
				author: 'torrent-feed',
				url: `${HOST}/guid/${entry.entry_id}`,
				date: entry.created_date,
				custom_elements: [
					{
						'enclosure': {
							_attr: {
								url: entry.data,
							},
						},
					},
				],
			});
		}

		var xml = feed.xml({
			indent: '\t',
		});
		res.type('application/xml');
		res.send(xml);
	});
});

module.exports = app;
