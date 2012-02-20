var getClient = require('./getclient.js').getClient;

exports.getPosts = function( userid, success, failure ) {
	var client = getClient();
	var sql = 
		'select post.id, post.title, post.description, post.body, post.votes, ' +
			'f.fk_user_id as voted, fk_created_by, user.username ' +
		'from post ' + 
		'left outer join ( ' + 
			'select * from vote where fk_user_id = ? ' +
		') f on f.fk_post_id = post.id ' + 
		'left join user on user.id = fk_created_by ' +
		// trying to get comment counts
		// 'left join (select count(*) as count, max(fk_parent_id) as fk_parent_id from post where fk_parent_id is not null group by fk_parent_id ) x on x.fk_parent_id = p.fk_parent_id' +
		'where fk_parent_id is null ' +
		'order by votes desc';
	console.log(sql);

	client.query( sql, [userid],
		function( err, results ) { 
			client.end();
			success( results );
		}
	);
}

exports.newPost = function( title, desc, body, userid, success, failure ) {
	var client = getClient();
	var sql = 'insert into post' + 
		'set title = ?, description = ?, votes = 1, fk_created_by = ?, body = ?';
	client.query( sql, [ title, desc, userid, body ], 
		function( err, results ) { 
			client.end();
			success();	
	});
};

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

