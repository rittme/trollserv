/*Define dependencies.*/

var fs = require('fs')
  , path = require("path")
  , express = require("express")
  , http = require("http")
  , multer  = require('multer')
  , app = express()
  , done = false
  , WebSocketServer = require('ws').Server;

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var uploadPath = /*process.env.OPENSHIFT_DATA_DIR ||*/ './uploads/';

var webSocketURL = 'troll-rittme.rhcloud.com:8000';

if(ip_address == '127.0.0.1') {
  webSocketURL = 'localhost:' + port;
}

app.set('views', __dirname + '/views'); // tell express which directory your views are in
app.set('view engine', 'mustache');     // name your templates
app.engine('mustache', require('hogan-middleware').__express); // register the engine

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);

var wss = new WebSocketServer({server: server});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

wss.on("connection", function(ws) {
  console.log("websocket connection open")
  ws.on("message", function(message) {
    ws.send(message);
  });
  ws.on("close", function() {
    console.log("websocket connection close");
  })
})

/*Configure the multer.*/

app.use(multer({ dest: uploadPath,
 rename: function (fieldname, filename) {
    return filename+Date.now();
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path)
    done=true;
  }
}));

/*Handling routes.*/

app.get('/', function(req,res) {
  res.render('home', { socketURL: webSocketURL});
});

app.get('/filelist/', function(req,res) {
  fs.readdir(uploadPath, function (err, files) {
      if (err) {
          throw err;
      }

      var fArray = files.map(function (file) {
          return path.join(uploadPath, file);
      }).filter(function (file) {
          return fs.statSync(file).isFile();
      });
      res.render('filelist', { filelist: fArray});
  });
});

app.post('/api/photo',function(req,res){
  if(done==true){
    console.log(req.files);
    if(req.files.user_photo) {
      wss.broadcast(req.files.user_photo.path);
    } else if (req.files.userPhoto) {
      wss.broadcast(req.files.userPhoto.path);
    }
    res.end("File uploaded.");
  }
});


// Error handlers
app.use(function(req, res, next){
  res.status(404);

  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  res.type('txt').send('Not found');
});
/*
app.use(function(err, req, res, next){
  res.status(err.status || 500);
  res.render('500', { error: err });
});
*/
/*Run the server.*/
server.listen(port, ip_address, function () {
  console.log("Listening on " + ip_address + ":" + port);
});
