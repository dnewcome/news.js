create table project (
	id integer not null auto_increment primary key,
	title varchar(1000), 
	description longtext character set utf8,
	votes integer,
	create_dt datetime not null,
	fk_created_by integer not null,
	fk_parent_id integer 
	-- fk_userid integer not null, 
	-- foreign key (fk_userid) references user(id)
);

create table user (
	id integer not null auto_increment primary key, 
	username varchar(25), 
	password varchar(25),
	unique( username )
);

create table vote (
	id integer not null auto_increment primary key, 
	fk_user_id int not null, 
	fk_project_id int not null
);

-- create table tag (
--	id integer not null auto_increment primary key,
--	name varchar(1000) not null,
--	fk_postid integer not null,
--	foreign key (fk_postid) references post(id)
-- );

-- create table ref (
--	id integer not null auto_increment primary key,
--	fk_fromid integer not null,
--	fk_toid integer not null,
--	foreign key (fk_fromid) references atom(id),
--	foreign key (fk_toid) references atom(id)
-- );
