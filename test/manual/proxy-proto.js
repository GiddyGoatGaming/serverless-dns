/**
 * This is a proxy proto server that prepends proxy proto header to a new
 * connection and forwards it to the upstream server.
 */

'use strict';

import net from 'net';
import proxyProtocol from 'proxy-protocol-js';

const CLIENT_PORT = 20000;
const UPSTREAM_PORT = 10000;

const src = new proxyProtocol.Peer('localhost', CLIENT_PORT);
const dst = new proxyProtocol.Peer('localhost', UPSTREAM_PORT);
const protocolText = new proxyProtocol.V1ProxyProtocol(
  proxyProtocol.INETProtocol.TCP4,
  src,
  dst
).build();

const server = net
  .createServer(serveConnection)
  .listen(CLIENT_PORT, () => console.log(server.address()));

function serveConnection(clientSocket) {
  const upSocket = net.connect(
    {
      host: 'localhost',
      port: UPSTREAM_PORT,
    },
    () => {
      if (!upSocket.destroyed) upSocket.write(Buffer.from(protocolText, 'ascii'));
      clientSocket.pipe(upSocket);
      upSocket.pipe(clientSocket);
    }
  );

  upSocket.on('error', (err) => {
    clientSocket.end();
  });

  clientSocket.on('error', (err) => {
    upSocket.destroy();
  });
}
