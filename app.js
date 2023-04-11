const express = require('express');
const app = express();

app.use(express.static('public/'));


const listener = app.listen(8080, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
