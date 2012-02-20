var getClient = require('./getclient.js').getClient;

/**
 * Wrapper function around recursive database get in order to 
 * create and reuse the same db connection for the entire operation.
 * Also retrieves the root posting before recursing into children.
 */
exports.getCommentsRecursive = function( postid, success, failure ) {
	var client = getClient();
	var sql = 'select post.*, user.username from post left join user on fk_created_by = user.id where post.id = ?';
	// var sql = 'select * from post where id = ?';
	client.query( sql, [ postid],
		function( err, results ) { 
		
		commentsRecurse( 
			client, postid,
			// handle calling 'end' on database connection here
			// in this small wrapper function.
			function( res ) { 
				var root = [];
				root.push({
					result: results[0],
					children: res
				});
				// set a flag on the root node so the template
				// knows to render the comment text area
				if( root[0].result ) {
					root[0].result.root = true;
				}
				client.end(); 
				console.log( 'final ' + JSON.stringify( root, null, 2 ) );
				success( root ); 
			}, failure 
		);

	});


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
	// var sql = 'select * from post where fk_parent_id = ? order by votes desc';
	var sql = 'select post.*, user.username from post left join user on post.fk_created_by = user.id where fk_parent_id = ? order by votes desc';
	client.query( sql, [ postid],
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
				// function needed to enclose scope of resobj
				(function() {
					var resobj = { result: results[i], children: []}; 
					res.push( resobj ); 
					// when recursing we give our own 'success' function.
					// the first level of recursion has the 'final' success function,
					// which is passed in externally. The rest use what is below.
					commentsRecurse( client, results[i]['id'], function( lsuccess ) { 	
						count++; 	
						// append level's child results as they are returned
						resobj.children = resobj.children.concat( lsuccess );

						// check that this is the last callback before returning success
						if( count == results.length ) { 
							// return success
							success( res ); 
						} 
					}, failure );	
				})();
			}
		}
	);
}

exports.newComment = function( body, userid, postid, success, failure ) {
	var client = getClient();
	var sql = 'insert into post ' + 
		'set description = ?, votes = 1, fk_created_by = ?, fk_parent_id = ?';
	client.query( sql, [ body, userid, postid ], 
		function( err, results ) { 
			client.end();
			success();	
	});
};


