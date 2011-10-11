#!/bin/bash

## create a db from scratch.
## Warning: current db will be dropped

## configure db name and auth
dbname=newsjs
dbuser=root
dbpass=root

echo ${dbname}

mysql -u $dbuser -p -e "drop database $dbname;"
mysql -u $dbuser -p -e "create database $dbname default character set utf8;"

mysql -u $dbuser -p $dbname < schema.sql
