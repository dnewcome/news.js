var model = require('./model');

var express = require('express');
var http = require('http');
var getClient = require('./getclient.js').getClient;
// var uuid = require('node-uuid');

var app = express.createServer();
app.use(express.bodyParser());

app.use(express.cookieParser());
app.use(express.session({ secret: "pearl cat" }));

app.use(express.static( __dirname + '/static' ));


/**
* Login 
*/
app.get('/login', function(req, res){
	console.log( 'running login controller');
	var client = getClient();
	
	res.render('login.jade', {info: req.flash('info')} );
//	res.render('login.jade');
});
app.post('/login', function(req, res){
	console.log( req.body );
	var client = getClient();
	client.query(
		'select id from user where username = ? and password = ?', 
		[req.body.username, req.body.password], 
		function( err, results ) { 
			if( results.length > 0 ) {
				client.end();
				req.session.authenticated = true;	
				req.session.username = req.body.username;	
				req.session.userid = results[0].id;	
				console.log( results );
				req.flash('info','logged in');
				res.redirect('/projects');
			}
			else {
				client.end();
				req.flash('info','login failed');
				res.redirect('/login');
			}	
		}
	);
});
app.get('/logout', function(req, res){
	req.session.authenticated = false;	
	req.session.username = '';	
	req.session.userid = '';	
	res.redirect('/login');
});

/**
* Main projects page
*/
app.get('/', function(req, res){
    res.redirect('/projects');
});
app.get('/projects', function(req, res){
	if( req.session.authenticated == false || req.session.authenticated == undefined ) {
		console.log( 'not authenticated - redirecting' );
		res.redirect('/login');
	}
	// note that else is necessary since res.redirect() is not blocking.
	else {
		console.log( 'authenticated: ' + req.session.authenticated );
		var client = getClient();
		client.query(
			'select * from project order by votes desc', 
			function( err, results ) { 
				console.log( results );
				client.end();
				res.render('projects.jade', { 
					projects: results, 
					username: req.session.username,
					userid: req.session.userid
				});
		});
	}
});


/**
* New project
*/
app.get('/newproject', function(req, res){
	var client = getClient();
	res.render('newproject.jade');
});
app.post('/projects', function(req, res){
	console.log( req.body );
	var client = getClient();
	client.query(
		'insert into project set title = ?, description = ?, votes = 0, fk_created_by = ?', 
		[req.body.title, req.body.description, req.session.userid], 
		function( err, results ) { 
			client.end();
			// using flash requires session support
			// req.flash('post updated');
			res.render('posted.jade', { action: 'edit' });
	});
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
	console.log( req.body );
	vote( res, req.params.id, "+1" );
});

app.get('/downvote/:id', function(req, res){
	console.log( req.body );
	vote( res, req.params.id, "-1" );
});

function vote( res, id, dir ) {
	var client = getClient();
	client.query(
		'update project set votes = votes ' + dir + ' where id = ?', 
		[id], 
		function( err, results ) { 
			client.end();
			res.redirect('/projects');
	});
}

app.listen(3000);

