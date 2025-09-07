require('dotenv').config();
const dns = require('node:dns');
const express = require('express');
const cors = require('cors');
let bodyParser = require('body-parser');

let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

let shortenSchema = new mongoose.Schema({
  original_url: String,
});


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

let Shorten = mongoose.model("shorten", shortenSchema);
app.post('/api/shorturl', async (req, res) => {
  let urlString;
  try {
    urlString = new URL(req.body.url);
  } catch (e) {
    return res.json({ error: 'invalid url', url: req.body.url });
  }

  dns.lookup(urlString.hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    } else {
      try {
        let document = new Shorten({ original_url: req.body.url });
        let data = await document.save();
        return res.json({
          original_url: data.original_url,
          short_url: data._id
        });
      } catch (err) {
        return res.json({ error: 'failed to save' });
      }
    }
  });
});

app.get('/api/shorturl/:shortId', async (req, res) => {
  try {
    let data = await Shorten.findById(req.params.shortId);
    if (!data) {
      return res.json({ error: 'No short URL found for given input' });
    }
    res.redirect(data.original_url);
  } catch (err) {
    return res.json({ error: 'Invalid short ID' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
