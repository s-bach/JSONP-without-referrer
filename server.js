var dir, fs, http, port, querystring, server, url, zlib;

dir = 'data';

port = 3226;

fs = require('fs');

http = require('http');

url = require('url');

querystring = require('querystring');

zlib = require('zlib');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

process.chdir(dir);

server = http.createServer();

server.on('request', function(request, response) {
  var body, done, parsedUrl, path, query;
  response.sendDate = false;
  done = function() {
    response.writeHead(404, {});
    return response.end('');
  };
  parsedUrl = url.parse(request.url);
  path = parsedUrl.pathname;
  if (!path) {
    return done();
  }
  path = path.replace(/[^\d\w$]/g, "");
  if (path === "") {
    return done();
  }
  if (request.method === "POST") {
    body = '';
    request.on('data', function(data) {
      return body += data;
    });
    return request.on('end', function() {
      return fs.writeFile(path, querystring.parse(body).data.replace(/\s/g, ''), {
        encoding: 'base64'
      }, function(err) {
        response.writeHead(200, {});
        return response.end('');
      });
    });
  } else {
    query = parsedUrl.query;
    if (!query) {
      return done();
    }
    query = query.replace(/[^\d\w$]/g, '');
    if (request.method !== "GET") {
      return done();
    }
    return fs.readFile(path, function(err, data) {
      if (err) {
        return done();
      }
      return fs.unlink(path, function() {
        var acceptEncoding;
        data = query + '(' + JSON.stringify(data.toString('base64')) + ')';
        acceptEncoding = request.headers['accept-encoding'];
        if (!acceptEncoding) {
          acceptEncoding = '';
        }
        if (acceptEncoding.match(/\bdeflate\b/)) {
          response.writeHead(200, {
            'Content-Encoding': 'deflate',
            'Content-Type': 'text/plain'
          });
          return zlib.deflate(data, function(err, data) {
            return response.end(data);
          });
        } else if (acceptEncoding.match(/\bgzip\b/)) {
          response.writeHead(200, {
            'Content-Encoding': 'gzip',
            'Content-Type': 'text/plain'
          });
          return zlib.gzip(data, function(err, data) {
            return response.end(data);
          });
        } else {
          response.writeHead(200, {
            'Content-Type': 'text/plain'
          });
          return response.end(data);
        }
      });
    });
  }
});

server.listen(port);
