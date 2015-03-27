/*Define dependencies.*/

var express = require("express")
  , http = require("http")
  , multer  = require('multer')
  , app = express()
  , done = false
  , WebSocketServer = require('ws').Server;

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

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

app.use(multer({ dest: './uploads/',
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

app.get('/',function(req,res){
  res.render('home', { socketURL: 'ws://' + ip_address + ":" + port});
  //res.sendfile("index.html");
});

app.post('/api/photo',function(req,res){
  if(done==true){
    console.log(req.files);
    wss.broadcast(req.files.userPhoto.path);
    res.end("File uploaded.");
  }
});

/*Run the server.*/
server.listen(port, ip_address, function () {
  console.log("Listening on " + ip_address + ", server_port " + port);
});
