var model = require('./comment-model');
var config = require('./config').config;

/**
* comments 
*/
app.post('/comments/:id', function(req, res, next ){
	console.log('precondition route for posting comment');
	loginCheck( req, res, next );
});
app.post( '/comments/:id', function( req, res ) {
	if( loggedin( req ) ) {
		console.log( req.body );
		model.newComment( 
			req.body.comment, 
			req.session.userid,
			req.params.id,
			function() {
				// res.render( 'posted.jade', { action: 'edit' } );
				res.redirect( req.header('Referrer'));
			}
		);
	}
});
app.get( '/comments/:id', function( req, res ) {
	if( config.anonaccess == false ) {
		if( req.session.authenticated == false 
		|| req.session.authenticated == undefined ) {
			console.log( 'not authenticated - redirecting' );
			res.redirect( '/login' );
		}
	}
	// note that else is necessary since res.redirect() is not blocking.
	else {
		model.getCommentsRecursive( req.params.id,
			function( data ) {
				res.render('comments.jade', { 
					comments: data, 
					username: req.session.username,
					userid: req.session.userid,
					postid: req.params.id
				});
			},
			function() {
				req.flash('info','error showing items');
			}
		);
	}
});
