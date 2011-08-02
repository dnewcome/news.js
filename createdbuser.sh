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

mysql -u $dbuser -p -e "create user 'workingon'@'localhost' identified by 'workingon';"
mysql -u $dbuser -p -e "grant insert, select, update, delete on workingon.* to 'workingon'@'localhost';"

