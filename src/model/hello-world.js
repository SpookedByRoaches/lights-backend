const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3005;

// Where we will keep books
let books = [];

app.use(cors());

// Configuring body parser middleware
app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());

app.get('/', (req, res) => {
    res.send('Hello World, from express');
});

app.post('/book', (req, res) => {
    const book = req.body;
    console.log(`adding ${book}`);
    books.push(book);
});

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));