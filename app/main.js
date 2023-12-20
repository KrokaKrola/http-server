const net = require('net');

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const requestData = data.toString();

    const [requestLine, ...headers] = requestData.split('\r\n');

    const [_method, path, _httpVersion] = requestLine.split(' ');

    if (path === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n');
    } if (path.startsWith('/echo')) {
      const content = path.replace(/^\/echo\//, '');
      const statusLine = 'HTTP/1.1 200 OK\r\n';
      const headers = `Content-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n`;

      socket.write(statusLine + headers + content);
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
