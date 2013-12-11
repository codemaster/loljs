var express = require('express');
var mock = express();

mock.get('/api/lol/:region/:version/champion', function(req, res) {
  res.end("{}");
});

mock.listen(9999, '127.0.0.1');

module.exports = mock;
