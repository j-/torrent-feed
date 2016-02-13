import { Buffer } from 'buffer';
import magnetURI from 'magnet-uri';
import parseTorrent from 'parse-torrent';
import Rx from 'rx';

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

const drops = Rx.Observable.fromEvent(window, 'drop');

const dataTransfers = drops.map((e) => e.dataTransfer);

const files = dataTransfers.selectMany((dt) => Rx.Observable.fromArray(dt.files));

const torrents = files
	.selectMany((file) => {
		const promise = new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener('load', (e) => resolve(e.target.result));
			reader.readAsArrayBuffer(file);
		});
		return Rx.Observable.fromPromise(promise);
	})
	.map((str) => new Buffer(str))
	.map((buffer) => parseTorrent(buffer));

torrents.forEach((torrent) => {
	console.log('Torrent', torrent);
	// uploadTorrent(torrent);
});

function getUploadURL() {
	return '/upload/7e710896-3899-49bb-bd97-c46833fdddcf';
}

function uploadTorrent (torrent) {
	var uri = magnetURI.encode({
		xt: torrent.xt,
		tr: torrent.tr,
	});
	var req = new XMLHttpRequest();
	req.open('POST', getUploadURL());
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.send('data=' + encodeURIComponent(uri));
}
