#!/bin/bash

curl localhost:3000/atom -XPOST --header Content-Type:"application/json" -d '{"text":"root"}'

