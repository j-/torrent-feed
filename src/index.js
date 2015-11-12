const database = require('./database');
const uuid = require('node-uuid');
const RSS = require('rss');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const key = () => uuid.v4();

const PORT = process.env.PORT || 3000;
const HOST = `http://localhost:${PORT}`;

database.initialize();

process.on('exit', () => {
	console.log('Bye');
	database.destroy();
});

app.get('/feed/:output.rss', (req, res) => {
	var output = req.params.output;
	var feed = new RSS({
		title: 'torrent-feed',
		description: 'Feed of torrents',
		site_url: `${HOST}/`,
		feed_url: `${HOST}/feed/${output}.rss`,
		generator: `${HOST}/`,
	});

	database.getAll(output).then((entries) => {
		for (var entry of entries) {
			feed.item({
				title: entry.entry_id,
				author: 'torrent-feed',
				url: `${HOST}/guid/${entry.entry_id}`,
				date: entry.created_date,
				custom_elements: [
					{
						'enclosure': {
							_attr: {
								url: entry.data
							}
						}
					}
				],
			});
		}

		var xml = feed.xml();
		res.send(xml);
	});
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/upload/:input', (req, res) => {
	var input = req.params.input;
	var data = req.body.data;

	database.insert(key(), input, data).then(() => {
		res.status(201);
		res.end();
	});
});

app.get('/guid/:guid', (req, res) => {
	res.redirect('/');
});

app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
