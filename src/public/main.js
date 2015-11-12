(function () {

var Buffer = buffer.Buffer;

function getUploadURL() {
	return '/upload/7e710896-3899-49bb-bd97-c46833fdddcf';
}

function getData (dt, type) {
	return dt.getData(type);
}

function validateTorrentData (candidate) {
	if (!candidate || !candidate.infoHash) {
		throw new Error('Candidate is not a valid torrent');
	}
	return candidate;
}

function parseAndValidateTorrentData (candidate) {
	var parsed = parseTorrent(candidate);
	return validateTorrentData(parsed);
}

function parseText (dt, type) {
	var data = getData(dt, type);
	var result = magnet(data);
	return Promise.resolve([result]);
}

function parseLink (dt, type) {
	var data = getData(dt, type);
	return new Promise(function (resolve, reject) {
		parseTorrent.remote(data, function (err, result) {
			if (err) {
				reject(err);
			}
			else {
				resolve([result]);
			}
		});
	});
}

function parseFiles (dt) {
	var promises = Array.prototype.map.call(dt.files, function (file) {
		return new Promise(function (resolve) {
			var reader = new FileReader();
			reader.addEventListener('load', function (e) {
				resolve(e.target.result);
			});
			reader.addEventListener('error', function () {
				resolve(null);
			});
			reader.readAsBinaryString(file);
		});
	});
	return Promise.all(promises)
		.then(function (results) {
			return results
				.filter(function (result) {
					return result !== null;
				})
				.map(function (file) {
					return new Buffer(file);
				})
				.map(parseAndValidateTorrentData);
		});
}

function parseDataTransferItem (dt, type) {
	console.log('%c' + type, 'font-weight: bold', dt.getData(type));
	switch (type) {
		case 'text/plain':
		case 'text/uri-list':
			return Promise.race([
				parseText(dt, type),
				parseLink(dt, type),
			]);
		case 'Files':
			return parseFiles(dt);
		default:
			var err = new Error('No torrents found');
			err.name = 'NoTorrentError';
			return Promise.reject(err);
	}
}

function parseDataTransfer (dt) {
	return Array.prototype.reduce.call(dt.types, function (result, type) {
		return result.catch(function () {
			return parseDataTransferItem(dt, type).then(function (results) {
				return Promise.all(results.map(validateTorrentData));
			});
		});
	}, Promise.reject());
}

function uploadTorrent (torrent) {
	var uri = magnet.encode({
		xt: torrent.xt,
		tr: torrent.tr,
	});
	var req = new XMLHttpRequest();
	req.open('POST', getUploadURL());
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.send('data=' + encodeURIComponent(uri));
}

document.addEventListener('dragover', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
});

document.addEventListener('drop', function (e) {
	e.preventDefault();
	var dt = e.dataTransfer;
	parseDataTransfer(dt).then(function (results) {
		results.map(uploadTorrent);
	}).catch(function (err) {
		if (err.name === 'NoTorrentError') {
			// Ignore these errors
			return;
		}
		throw err;
	});
});

var dropEffectElement = document.createElement('div');
dropEffectElement.classList.add('drop-effect');

function startEffect () {
	dropEffectElement.classList.add('dragover');
}

function stopEffect () {
	dropEffectElement.classList.remove('dragover');
}

document.addEventListener('DOMContentLoaded', function () {
	document.body.appendChild(dropEffectElement);
});

document.addEventListener('dragover', startEffect);
document.addEventListener('dragleave', stopEffect);
document.addEventListener('dragend', stopEffect);
document.addEventListener('drop', stopEffect);

})();
