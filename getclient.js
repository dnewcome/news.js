var config = require('./config').config;
function getClient() {
	var Client = require('mysql').Client,
	client = new Client()

	client.user = 'newsjs';
	client.password = 'newsjs';

	// client.connect();
	// client.useDatabase( 'newsjsdev', function(){} );
	client.useDatabase( config.dbname, function(){} );
	return client;
}

exports.getClient = getClient;
