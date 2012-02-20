var model = require('./model');
var crypto = require('crypto');

/**
* Login 
*/
app.get('/login', function(req, res){
	res.render('login.jade', {info: req.flash('info')} );
});
app.post('/login', function(req, res){
	var pwhash = doShaHash( req.body.password );	
	model.login( 
		req.body.username, 
		pwhash,
		function( data ) {
			req.session.authenticated = true;	
			req.session.username = req.body.username;	
			req.session.userid = data.userid;	
			req.flash('info','logged in');
			res.redirect('/posts');
		},
		function() {
			req.flash('info','login failed');
			res.redirect('/login');
		}
	);
});

/**
 * Utility function for creating a sha1 hmac of the password
 * key is fixed.
 */
function doShaHash( key ) {
    var sha1 = crypto.createHmac( 'sha1', 'batman' );
    sha1.update( key );
    return sha1.digest( 'hex' );
}
