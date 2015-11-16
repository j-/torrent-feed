const database = require('./database');
const feeds = require('./feeds');
const uuid = require('node-uuid');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const key = () => uuid.v4();

const PORT = process.env.PORT || 3000;
process.env.PORT = PORT;

database.initialize();

process.on('exit', () => {
	console.log('Bye');
	database.destroy();
});

app.use('/feed', feeds);

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

app.use(express.static(__dirname + '/../public'));

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
