create table post (
	id integer not null auto_increment primary key,
	title varchar(1000), 
	description longtext character set utf8,
	body varchar(20000), 
	votes integer,
	create_dt datetime not null,
	fk_created_by integer not null,
	fk_parent_id integer,
	foreign key (fk_created_by) references user(id)
);

create table vote (
	id integer not null auto_increment primary key, 
	fk_user_id int not null, 
	fk_post_id int not null
);

