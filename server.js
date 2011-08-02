var express = require('express');
var http = require('http');
var getClient = require('./getclient.js').getClient;
// var uuid = require('node-uuid');

var app = express.createServer();
app.use(express.bodyParser());
app.use(express.static( __dirname + '/static' ));

/**
* Main projects page
*/
app.get('/', function(req, res){
    res.redirect('/projects');
});
app.get('/projects', function(req, res){
	var client = getClient();
	client.query(
		'select * from project order by votes desc', 
		function( err, results ) { 
			console.log( results );
			client.end();
			res.render('projects.jade', { projects: results });
	});
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
		'insert into project set title = ?, description = ?, votes = 0', 
		[req.body.title, req.body.description], 
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

