#!/bin/bash

for ((i=1; i<=221; i++)); do 
curl -v http://52.201.239.106:6060/api/questions; 
done;
