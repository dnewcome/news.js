
/**
 * Handles redirection to the login page for actions
 * that require login.
 */
exports.loginCheck = function( req, res, next ) {
	console.log( 'checking login' );
	if( loggedin( req ) ) {
		next();	
	}
	else {
		res.redirect('/login');
	}
};

exports.loggedin = loggedin = function( req ) {
	var retval = false;
	if( req.session.userid != null ) {
		retval = true;
	}
	console.log('loggedin(): ' + retval );
	return retval;
}
