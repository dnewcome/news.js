var model = require('./model');

var express = require('express');
var http = require('http');
var getClient = require('./getclient.js').getClient;

var app = express.createServer();
app.use(express.bodyParser());

app.use(express.cookieParser());
app.use(express.session({ secret: "batman" }));

app.use(express.static( __dirname + '/static' ));

/** Some global config **/
// allow anonymous viewing
var anonaccess = true;

/**
* Login 
*/
app.get('/login', function(req, res){
	res.render('login.jade', {info: req.flash('info')} );
});
app.post('/login', function(req, res){
	console.log( req.body );
	model.login( 
		req.body.username, 
		req.body.password,
		function( data ) {
			req.session.authenticated = true;	
			req.session.username = req.body.username;	
			req.session.userid = data.userid;	
			req.flash('info','logged in');
			res.redirect('/projects');
		},
		function() {
			req.flash('info','login failed');
			res.redirect('/login');
		}
	);
});
app.post('/signup', function(req, res){
	model.signup( 
		req.body.newusername, 
		req.body.newpassword,
		function( data ) {
			req.session.authenticated = true;	
			req.session.username = req.body.newusername;	
			req.session.userid = data.userid;	
			console.log( req.session.userid );
			req.flash('info','logged in');
			res.redirect('/projects');
		},
		function() {
			req.flash('info','signup failed - duplicate name');
			res.redirect('/login');
		}
	);
});
app.get( '/logout', function( req, res ) {
	req.session.authenticated = false;	
	req.session.username = '';	
	req.session.userid = null;	
	req.flash('info','logged out');
	res.redirect('/login');
});

/**
 * We can use a route like this to look at all top 
 * level routes to see if they require login.
 */
app.get( '/:foo', function( req, res, next ) {
	console.log( 'route - ' + req.params.foo );
	next();	
});

/**
* Main projects page
*/
app.get( '/', function( req, res ) {
    res.redirect('/projects');
});
app.get( '/projects', function( req, res ) {
	if( anonaccess == false ) {
		if( req.session.authenticated == false 
		|| req.session.authenticated == undefined ) {
			console.log( 'not authenticated - redirecting' );
			res.redirect( '/login' );
		}
	}
	// note that else is necessary since res.redirect() is not blocking.
	else {
		model.getProjects( req.session.userid,
			function( data ) {
				res.render('projects.jade', { 
					projects: data, 
					username: req.session.username,
					userid: req.session.userid
				});
			},
			function() {
				req.flash('info','error showing items');
			}
		);
	}
});

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
	if( anonaccess == false ) {
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

/**
* New project
*/
app.get('/newproject', function(req, res, next ){
	console.log('precondition route for new project');
	loginCheck( req, res, next );
});
app.get('/newproject', function(req, res){
	res.render('newproject.jade');
});

app.post('/projects', function(req, res){
	if( loggedin( req ) ) {
		console.log( req.body );
		model.newProject( 
			req.body.title, 
			req.body.description, 
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
app.get('/editproject/:id', function(req, res){
	console.log( "edit a project");
	var client = getClient();
	client.query(
		'select * from project where id = ?', 
		[ req.params.id ], 
		function( err, results ) { 
			console.log( results );
			client.end();
			res.render('editproject.jade', { project: results[0] });
	});
});
app.post('/editproject/:id', function(req, res){
	console.log('/editproject/' + req.params.id );
	console.log( req.body );
	var client = getClient();
	client.query(
		'update project set title = ?, description = ? where id = ?', 
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
app.get('/deleteproject/:id', function(req, res){
	console.log( req.body );
	var client = getClient();
	client.query(
		'delete from project where id = ?', 
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
			res.redirect('/projects');
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
			res.redirect('/projects');
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

app.listen(3000);

