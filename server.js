/*Define dependencies.*/

var express=require("express")
  , multer  = require('multer')
  , app=express()
  , done=false
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 3001 });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};
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
    wss.broadcast(req.files);
    res.end("File uploaded.");
  }
});

/*Run the server.*/
app.listen(3000,function(){
    console.log("Working on port 3000");
});
