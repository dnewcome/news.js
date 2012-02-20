var getClient = require('./getclient.js').getClient;

exports.upvote = function( id, userid, success, failure ) {
	vote( id, userid, "+1", function() { success(); }  );
};

exports.downvote = function( id, userid, success, failure ) {
	vote( id, userid, "-1", function() { success(); }  );
}

/**
 * Helper function for voting
 */
function vote( id, userid, dir, cb ) {
	console.log('callback cb() is ' + cb);
	var client = getClient();
	var sql = 
		'update post set votes = votes ' + dir + ' where id = ?'; 
	sql += 
		' and not exists ( ' + 
			'select * from vote where fk_post_id= ? and fk_user_id = ? ' +
		')';
	client.query(
		sql, [id,id,userid], 
		function( err, results ) { 
			console.log(results);
			// only insert vote row if we updated earlier
			if( results.affectedRows != 0 ) {
				client.query(
					'insert into vote ( fk_user_id, fk_post_id ) values (?,?) ',
					[userid,id], 
					function( err, results ) { 
						client.end();
						cb(); 
					}
				);
			}
			else {
				cb(); 
			}
		}
	);
}

