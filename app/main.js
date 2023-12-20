const net = require('net');
const fs = require('fs');
const nodePath = require('path');

const buildResponse = (content, contentType = 'text/plain', status = 200) => {
    const statusLine = `HTTP/1.1 ${status} OK\r\n`;
    const headers = `Content-Type: ${contentType}\r\nContent-Length: ${content.length}\r\n\r\n`;

    return statusLine + headers + content;
}

const getNotFoundResponse = () => {
    return 'HTTP/1.1 404 Not Found\r\n\r\n';
}

const readFileAsync = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    })
}

const writeFileAsync = (path, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    })
}

const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
        const requestData = data.toString();
        const [requestLine, ...headers] = requestData.split('\r\n');
        const [method, path, _httpVersion] = requestLine.split(' ');

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
        } else if (path.startsWith('/files') && method === 'GET') {
            const directory = process.argv.slice(2)[1];

            const fileName = path.replace(/^\/files\//, '');
            try {
                const data = await readFileAsync(nodePath.join(directory, fileName));
                const response = buildResponse(data.toString(), 'application/octet-stream');
                socket.write(response);
            } catch (err) {
                socket.write(getNotFoundResponse());
                socket.end();
            }
        } else if (path.startsWith('/files') && method === 'POST') {
            const directory = process.argv.slice(2)[1];
            const fileName = path.replace(/^\/files\//, '');

            const body = headers[headers.length - 1];

            try {
                await writeFileAsync(nodePath.join(directory, fileName), body);
                socket.write(buildResponse('', 'text/plain', 201));
            } catch (err) {
                socket.write(getNotFoundResponse());
            }
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
