const net = require('net');
const fs = require('fs');
const nodePath = require('path');

const buildResponse = (content, contentType = 'text/plain') => {
    const statusLine = 'HTTP/1.1 200 OK\r\n';
    const headers = `Content-Type: ${contentType}\r\nContent-Length: ${content.length}\r\n\r\n`;

    return statusLine + headers + content;
}

const getNotFoundResponse = () => {
    return 'HTTP/1.1 404 Not Found\r\n\r\n';
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
        } else if (path.startsWith('/files')) {
            const directoryArg = process.argv.slice(2)[0];
            const directory = directoryArg.replace('--directory=', '');

            const fileName = path.replace(/^\/files\//, '');
            fs.readFile(nodePath.join(directory, fileName), (err, data) => {
                if (err) {
                    socket.write(getNotFoundResponse());
                } else {
                    const response = buildResponse(data.toString(), 'application/octet-stream');
                    socket.write(response);
                }
            });
        } else {
            socket.write(getNotFoundResponse());
        }
    });

    socket.on('close', () => {
        socket.end();
        server.close();
    });
});

server.listen(4221, 'localhost');
