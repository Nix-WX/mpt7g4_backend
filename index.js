const http = require('http');
const app = require('./app');

const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const port = process.env.PORT;
const server = https.createServer(options, app);

server.listen(port);