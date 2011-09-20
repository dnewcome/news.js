
function getClient() {
	var Client = require('mysql').Client,
	client = new Client()

	client.user = 'root';
	client.password = 'root';

	// client.connect();
	client.useDatabase( 'workingon', function(){} );
	return client;
}

exports.getClient = getClient;
