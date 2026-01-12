import express from 'express';
import {createServer} from "node:http";

const app = express();
const server = createServer(app);

app.get('/', (req,res) => {
    res.send('<h1>Socket.IO</h1>')
});

server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
})