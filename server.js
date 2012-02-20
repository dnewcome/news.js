var model = require('./model');

var config = require('./config').config;
var express = require('express');
var http = require('http');
var getClient = require('./getclient.js').getClient;

app = createApp();

// pull in more routings
require( './account.js' );
require( './comment.js' );



/**
 * We can use a route like this to look at all top 
 * level routes to see if they require login.
 */
app.get( '/:foo', function( req, res, next ) {
	console.log( 'route - ' + req.params.foo );
	next();	
});

/**
* Main posts page
*/
app.get( '/', function( req, res ) {
    res.redirect('/posts');
});

app.get( '/posts', doPost );

function doPost( req, res ) {
	if( config.anonaccess == false ) {
		if( req.session.authenticated == false 
		|| req.session.authenticated == undefined ) {
			console.log( 'not authenticated - redirecting' );
			res.redirect( '/login' );
		}
	}
	// note that else is necessary since res.redirect() is not blocking.
	else {
		model.getPosts( req.session.userid,
			function( data ) {
				console.log(data);
				res.render('posts.jade', { 
					posts: data, 
					username: req.session.username,
					userid: req.session.userid
				});
			},
			function() {
				req.flash('info','error showing items');
				res.render('posted.jade' );
			}
		);
	}
}



/**
* New post 
*/
app.get('/newpost', function(req, res, next ){
	console.log('precondition route for new post');
	loginCheck( req, res, next );
});
app.get('/newpost', function(req, res){
	res.render('newpost.jade', { username: req.session.username });
});

app.post('/posts', function(req, res){
	if( loggedin( req ) ) {
		console.log( req.body );
		model.newPost( 
			req.body.title, 
			req.body.description, 
			req.body.body,
			req.session.userid,
			function() {
				res.render( 'posted.jade', { action: 'edit' } );
			}
		);
	}
});

/**
* Editing
*/
app.get('/editpost/:id', function(req, res){
	console.log( "edit a post");
	var client = getClient();
	client.query(
		'select * from post where id = ?', 
		[ req.params.id ], 
		function( err, results ) { 
			console.log( results );
			client.end();
			res.render('editpost.jade', { post: results[0] });
	});
});
app.post('/editpost/:id', function(req, res){
	console.log('/editpost/' + req.params.id );
	console.log( req.body );
	var client = getClient();
	client.query(
		'update post set title = ?, description = ? where id = ?', 
		[req.body.title, req.body.description, req.params.id], 
		function( err, results ) { 
			client.end();
			// using flash requires session support
			// req.flash('post updated');
			res.render('posted.jade', { action: 'edit' });
	});
});


/**
* Delete
*/
app.get('/confirmdelete/:id', function(req, res){
    res.render('confirm.jade', { id: req.params.id });
});
app.get('/deletepost/:id', function(req, res){
	if( config.disableDelete == true ) { 
		res.end(); 
		return;
	}
	console.log( req.body );
	var client = getClient();
	client.query(
		'delete from post where id = ?', 
		[req.params.id], 
		function( err, results ) { 
			client.end();
			res.render('posted.jade', { action: 'delete' });
	});
});

/**
* voting
*/
app.get('/upvote/:id', function(req, res){
	if( loggedin(req) ) {
		model.upvote( req.params.id, req.session.userid, function() {
			// res.redirect('/');
			res.redirect( req.header('Referrer'));
		});
	}
	else {
		req.flash('info','log in to vote');
		res.redirect('/login');
	}
});
app.get('/downvote/:id', function(req, res){
	if( loggedin(req) ) {
		model.downvote( req.params.id, req.session.userid, function() {
			res.redirect('/posts');
		});
	}
	else {
		req.flash('info','log in to vote');
		res.redirect('/login');
	}
});

function loggedin( req ) {
	var retval = false;
	if( req.session.userid != null ) {
		retval = true;
	}
	console.log('loggedin(): ' + retval );
	return retval;
}

/**
* display the faq
*/
app.get('/faq', function( req, res ) {
	res.render( 'faq.jade' );
});

app.listen(config.port);

/**
 * Utility function to set the Express app up 
 * with the proper middleware.
 */
function createApp() {
	var app = express.createServer();

	// we need body parser for form post data, etc. 
	app.use(express.bodyParser());

	// cookie parser and session middleware for login
	app.use(express.cookieParser());
	app.use(express.session({ secret: "batman" }));

	// serve up static/ folder as static content
	app.use(express.static( __dirname + '/static' ));

	// give templates access to root folder specified 
	// in config via the Express 'helpers' mechanism.
	app.helpers(config);

	return app;
}


/**
 * Handles redirection to the login page for actions
 * that require login.
 */
function loginCheck( req, res, next ) {
	console.log( 'checking login' );
	if( loggedin( req ) ) {
		next();	
	}
	else {
		res.redirect('/login');
	}
};
