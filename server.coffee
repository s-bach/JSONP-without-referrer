dir = 'data'
port = 3226


fs = require 'fs'
http = require 'http'
url = require 'url'
querystring = require 'querystring'
zlib = require 'zlib'

fs.mkdirSync dir if !fs.existsSync dir
process.chdir dir;
server = do http.createServer
server.on 'request', (request, response) ->
	response.sendDate = false
	#console.log 'request'
	done = () ->
		response.writeHead(404, {})
		response.end ''
	parsedUrl = url.parse request.url
	path = parsedUrl.pathname
	return do done if !path
	path = path.replace /[^\d\w$]/g, ""
	return do done if path == ""
	#console.log path
	if request.method == "POST"
		body = '';
		request.on 'data', (data) ->
			body += data;
		request.on 'end', () ->
			#console.log 'save of: ' + querystring.parse(body).data
			fs.writeFile(
				path,
				querystring.parse(body).data.replace(/\s/g, ''),
				{encoding: 'base64'},
				(err) ->
					response.writeHead(200, {})
					response.end ''
			)
	else
		query = parsedUrl.query
		return do done if !query
		query = query.replace /[^\d\w$]/g, ''
		return do done if request.method != "GET"
		fs.readFile path, (err, data) ->
			return do done if err
			#console.log 'load of: ' + data.toString('base64')
			fs.unlink path, () ->
				data = query + '(' + JSON.stringify(data.toString('base64')) + ')'
				acceptEncoding = request.headers['accept-encoding'];
				acceptEncoding = '' if (!acceptEncoding)
				# Note: this is not a conformant accept-encoding parser.
				# See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
				if (acceptEncoding.match(/\bdeflate\b/))
					response.writeHead(200, {'Content-Encoding': 'deflate', 'Content-Type': 'text/plain'});
					zlib.deflate data, (err, data) ->
						response.end data
				else if (acceptEncoding.match(/\bgzip\b/))
					response.writeHead(200, {'Content-Encoding': 'gzip', 'Content-Type': 'text/plain'});
					zlib.gzip data, (err, data) ->
						response.end data
				else
					response.writeHead(200, {'Content-Type': 'text/plain'});
					response.end data
server.listen port