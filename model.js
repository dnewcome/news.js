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

exports.getProjects = function( userid, success, failure ) {
	var client = getClient();
	// var sql = 'select * from project order by votes desc'; 
	var sql = 
		'select * from project where fk_parent_id is null ' +
		'left outer join ( ' + 
			'select * from vote where fk_user_id = ? ' +
		') f on f.fk_project_id = project.id order by votes desc';

	var sql = 
		'select project.id, project.title, project.description, project.votes, ' +
			'f.fk_user_id as voted, fk_created_by, user.username ' +
		'from project ' + 
		'left outer join ( ' + 
			'select * from vote where fk_user_id = ? ' +
		') f on f.fk_project_id = project.id ' + 
		'left join user on user.id = fk_created_by ' +
		// trying to get comment counts
		// 'left join (select count(*) as count, max(fk_parent_id) as fk_parent_id from project where fk_parent_id is not null group by fk_parent_id ) x on x.fk_parent_id = p.fk_parent_id' +
		'where fk_parent_id is null ' +
		'order by votes desc';


	client.query( sql, [userid],
		function( err, results ) { 
			client.end();
			success( results );
		}
	);
}

exports.getComments = function( userid, postid, success, failure ) {
	var client = getClient();
	var sql = 'select * from project where fk_parent_id = ?';
	client.query( sql, [postid],
		function( err, results ) { 
			client.end();
			success( results );
		}
	);
}

/**
 * Wrapper function around recursive database get in order to 
 * create and reuse the same db connection for the entire operation.
 */
exports.getCommentsRecursive = function( postid, success, failure ) {
	var client = getClient();
	commentsRecurse( 
		client, postid,
		// handle calling 'end' on database connection here
		// in this small wrapper function.
		function( res ) { 
			client.end(); 
			success( res ); 
		}, failure 
	);
}

/**
 * Internal function that does an async recursive get from the 
 * database.
 */
function commentsRecurse( client, postid, success, failure ) {
	// the response, which is built up over the course of 
	// successive async callbacks as they return.
	var res = [];

	// keep track of how many callbacks have occurred 
	// this is necessary in order to avoid returning prematurely
	// when several async calls are in flight at the same level.
	var count = 0;	

	// make an async call to mysql as ususal, the magic happens in
	// the callbacks.
	var sql = 'select * from project where fk_parent_id = ? order by votes desc';
	client.query( sql, [ postid ],
		function( err, results ) { 

			// we have to check for zero results here to avoid
			// erroneously calling 'success' since the following iteration
			// is fully asynchronous - putting this after the loop without
			// a guard would not work.
			if( results.length == 0 ) {
				console.log( 'no results - returning' + JSON.stringify( res ) );
				success( res ); 
			}
			for( var i=0; i < results.length; i++ ) {
				// when recursing we give our own 'success' function.
				// the first level of recursion has the 'final' success function,
				// which is passed in externally. The rest use what is below.
				commentsRecurse( client, results[i]['id'], function( lsuccess ) { 	
					count++; 	
					// append level's child results as they are returned
					res = res.concat( lsuccess );

					// check that this is the last callback before returning success
					if( count == results.length ) { 
						// add the current level's results and return success
						success( res.concat( results ) ); 
					} 
				}, failure );	
			}
		}
	);
}

exports.newComment = function( body, userid, postid, success, failure ) {
	var client = getClient();
	var sql = 'insert into project ' + 
		'set description = ?, votes = 1, fk_created_by = ?, fk_parent_id = ?';
	client.query( sql, [ body, userid, postid ], 
		function( err, results ) { 
			client.end();
			success();	
	});
};

exports.newProject = function( title, desc, userid, success, failure ) {
	var client = getClient();
	var sql = 'insert into project ' + 
		'set title = ?, description = ?, votes = 1, fk_created_by = ?';
	client.query( sql, [ title, desc, userid ], 
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
		'update project set votes = votes ' + dir + ' where id = ?'; 
	sql += 
		' and not exists ( ' + 
			'select * from vote where fk_project_id = ? and fk_user_id = ? ' +
		')';
	client.query(
		sql, [id,id,userid], 
		function( err, results ) { 
			console.log(results);
			// only insert vote row if we updated earlier
			if( results.affectedRows != 0 ) {
				client.query(
					'insert into vote ( fk_user_id, fk_project_id ) values (?,?) ',
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

