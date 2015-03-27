/*Define dependencies.*/

var express = require("express")
  , http = require("http")
  , multer  = require('multer')
  , app = express()
  , done = false
  , WebSocketServer = require('ws').Server;

var port = process.env.PORT || 5000;

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
      res.sendfile("index.html");
});

app.post('/api/photo',function(req,res){
  if(done==true){
    console.log(req.files);
    wss.broadcast(req.files.userPhoto.path);
    res.end("File uploaded.");
  }
});

/*Run the server.*/
server.listen(port, function () {
  console.log("http server listening on %d", port)
});
