create table user (
	id integer not null auto_increment primary key, 
	username varchar(25), 
	-- pw hashed using sha1, needs 40 hex chars
	password varchar(40),
	unique( username )
);
