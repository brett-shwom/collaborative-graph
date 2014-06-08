var express = require('express')
var app = express()
var EXPRESS_ROOT = __dirname + '/target'
app.use(express.static(EXPRESS_ROOT))
app.get('*', function(request, response) { //pushState support
  response.sendfile(EXPRESS_ROOT + '/index.html')
})

app.listen(process.env.PORT || 3000);
