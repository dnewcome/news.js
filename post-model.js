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
	var sql = 'insert into post ' + 
		'set title = ?, description = ?, votes = 1, fk_created_by = ?, body = ?';
	client.query( sql, [ title, desc, userid, body ], 
		function( err, results ) { 
			client.end();
			success();	
	});
};

