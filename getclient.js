
function getClient() {
	var Client = require('mysql').Client,
	client = new Client()

	client.user = 'newsjs';
	client.password = 'newsjs';

	// client.connect();
	client.useDatabase( 'newsjs', function(){} );
	return client;
}

exports.getClient = getClient;
