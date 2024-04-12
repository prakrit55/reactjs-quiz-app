#!/bin/bash

for ((i=1; i<=500; i++)); do 
curl -v localhost:3000/api/questions; 
done;
