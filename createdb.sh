#!/bin/bash

## create a db from scratch.
## Warning: current db will be dropped

## configure db name and auth
dbname=workingon
dbuser=root
dbpass=root

echo ${dbname}

mysql -u $dbuser --password=$dbpass -e "drop database $dbname;"
mysql -u $dbuser --password=$dbpass -e "create database $dbname default character set utf8;"

mysql -u $dbuser --password=root $dbname < schema.sql
