var config = require('./config').config;
function getClient() {
	var Client = require('mysql').Client,
	client = new Client()

	client.user = config.dbusername;
	client.password = config.dbpassword;

	client.useDatabase( config.dbname, function(){} );
	return client;
}

exports.getClient = getClient;
