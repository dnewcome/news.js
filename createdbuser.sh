#!/bin/bash

## create a db from scratch.
## Warning: current db will be dropped

## configure db name and auth
dbname=workingon
dbuser=root

## we don't take pass as arg for security
## mysql -p will prompt without echo 
# dbpass=$1


echo ${dbname}

mysql -u $dbuser -p -e "create user 'newsjs'@'localhost' identified by 'newsjs';"
mysql -u $dbuser -p -e "grant insert, select, update, delete on newsjs.* to 'newsjs'@'localhost';"

