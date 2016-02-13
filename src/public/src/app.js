// import Buffer from 'buffer';
// import magnetURI from 'magnet-uri';
// import parseTorrent from 'parse-torrent';
import Rx from 'rx';

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

const drops = Rx.Observable.fromEvent(window, 'drop');

const dataTransfers = drops.map((e) => e.dataTransfer);

const files = dataTransfers.selectMany((dt) => Rx.Observable.fromArray(dt.files));

files.forEach(function (file) {
	console.log('File', file);
});
