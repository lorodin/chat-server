const express = require('express');
const app = express();
const http = require('http').Server(app);
const Server = require('./libs/server.io');

const host = 'localhost';
const port = process.env.port || 8080;

const server = new Server();

http.listen(port);


server.start(http);
