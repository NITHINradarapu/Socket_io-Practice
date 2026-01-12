import express from 'express';
import {createServer} from "node:http";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {Server} from "socket.io";
import Database from 'better-sqlite3';

// open the database file
const db = new Database('chat.db');

// create our 'messages' table (you can ignore the 'client_offset' column for now)
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req,res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', async (socket) => {
  socket.on('chat message', (msg) => {
    let result;
    try {
      // store the message in the database
      result = db.prepare('INSERT INTO messages (content) VALUES (?)').run(msg);
    } catch (e) {
      // TODO handle the failure
      return;
    }
    // include the offset with the message
    io.emit('chat message', msg, result.lastInsertRowid);
  });

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      const rows = db.prepare('SELECT id, content FROM messages WHERE id > ?')
        .all(socket.handshake.auth.serverOffset || 0);
      
      rows.forEach(row => {
        socket.emit('chat message', row.content, row.id);
      });
    } catch (e) {
      // something went wrong
    }
  }
});


server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
})