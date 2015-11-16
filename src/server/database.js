'use strict';

const sqlite = require('sqlite3').verbose();
const connection = Symbol('connection');

class Database {
	constructor () {
		this[connection] = new sqlite.Database(':memory:');
	}

	initialize () {
		this[connection].serialize(() => {
			this[connection].run(`CREATE TABLE entries (
				entry_id CHAR(36) PRIMARY KEY NOT NULL,
				input_id CHAR(36) NOT NULL,
				data TEXT,
				created_date DATETIME DEFAULT CURRENT_TIMESTAMP
			)`);
			this[connection].run(`CREATE TABLE inputs (
				input_id CHAR(36) PRIMARY KEY NOT NULL,
				created_date DATETIME DEFAULT CURRENT_TIMESTAMP
			)`);
			this[connection].run(`CREATE TABLE outputs (
				output_id CHAR(36) PRIMARY KEY NOT NULL,
				input_id CHAR(36) NOT NULL,
				created_date DATETIME DEFAULT CURRENT_TIMESTAMP
			)`);

			// Fixture data
			this[connection].run(`INSERT INTO inputs(input_id) VALUES ('7e710896-3899-49bb-bd97-c46833fdddcf')`);
			this[connection].run(`INSERT INTO outputs(output_id, input_id) VALUES ('a7dfc8db-533a-4f59-b51a-c901a4b0e3d2', '7e710896-3899-49bb-bd97-c46833fdddcf')`);
		});
	}

	insert (id, queue, data) {
		return new Promise((resolve, reject) => {
			this[connection].serialize(() => {
				let stmt = this[connection].prepare(`INSERT INTO entries(entry_id, input_id, data) VALUES (?, ?, ?)`);
				stmt.run(id, queue, data);
				stmt.finalize((err) => {
					if (err) reject(err);
					else resolve();
				});
			});
		});
	}

	getAll (queue) {
		return new Promise((resolve, reject) => {
			var query = `
				SELECT
					outputs.output_id,
					entries.entry_id,
					entries.data,
					entries.created_date
				FROM
					entries
					INNER JOIN outputs ON
						entries.input_id = outputs.input_id
				WHERE
					outputs.output_id = ?
			`;
			this[connection].all(query, [queue], (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});
	}

	destroy () {
		this[connection].close();
	}
}

module.exports = new Database();
