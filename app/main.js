const net = require('net');

const buildResponse = (content) => {
    const statusLine = 'HTTP/1.1 200 OK\r\n';
    const headers = `Content-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n`;

    return statusLine + headers + content;
}

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const requestData = data.toString();
    const [requestLine, ...headers] = requestData.split('\r\n');
    const [_method, path, _httpVersion] = requestLine.split(' ');

    if (path === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
    } else if (path.startsWith('/echo')) {
      const content = path.replace(/^\/echo\//, '');

      const response = buildResponse(content);
      socket.write(response);
    } else if (path === '/user-agent') {
      const userAgentLine = headers.find((line) => line.startsWith('User-Agent'));
      const [_, userAgent] = userAgentLine.split(': ');

      const response = buildResponse(userAgent);
      socket.write(response);
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  });

  socket.on('close', () => {
    socket.end();
    server.close();
  });
});

server.listen(4221, 'localhost');
