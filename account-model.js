var getClient = require('./getclient.js').getClient;

exports.login = function( username, password, success, failure ) {
	var client = getClient();
	var sql = 'select id from user where username = ? and password = ?';
	client.query( sql, [ username, password ], 
		function( err, results ) { 
			if( results.length > 0 ) {
				client.end();
				console.log( results );
				success({ 
					userid: results[0].id 
				});
			}
			else {
				client.end();
				failure();
			}	
		}
	);
};
exports.signup = function( username, password, success, failure ) {
	var client = getClient();
	var sql = 'insert into user ( username, password ) values ( ?, ? )';
	client.query( sql, [ username, password ], 
		function( err, results ) { 
			if( err == null && results.affectedRows > 0 ) {
				client.end();
				console.log( results );
				success({ 
					userid: results.insertId 
				});
			}
			else {
				client.end();
				failure();
			}	
		}
	);
};
