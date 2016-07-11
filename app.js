
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongodb =require('mongodb');

var app = express();

app.configure(function () {
  app.engine('html', require('uinexpress').__express);
  app.set('view engine', 'html');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
//  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

var server = http.createServer(app),
io = require('socket.io').listen(server);

server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

// connect to mongodb
var db = new mongodb.Db('mydb', new mongodb.Server('localhost', 27017, {auto_reconnect: true}), {w: 1});

db.open( function(err, conn) {
  db.collection('chatroomMessages', function(err, collection) {
    // init the chatroom
    chatroomInit(collection);
  });
});

var chatroomInit = function(messageCollection) {
  var moment = require('moment'),
      activeClients = 0;

  // on connection
  io.sockets.on('connection', function(socket) {
    activeClients++;
    io.sockets.emit('message', {clients: activeClients});

    // on disconnect
    socket.on('disconnect', function(data) {
      activeClients--;
      io.sockets.emit('message', {clients: activeClients});
    
      // if no active users close db connection
      if ( !activeClients ) db.close();
    });
    
    // pull in the last 10 messages from mongodb
    messageCollection.find({}, {sort:[['_id', 'desc']], limit: 10}).toArray(function(err, results) {
      // loop through results in reverse order
      var i = results.length;
      while(i--) {
        // send each over the single socket
        socket.emit('chat', results[i]);
      }
    });
    
    // new chat received
    socket.on('newchat', function(data) {
      data.timestamp = moment().format('h:mm');
      io.sockets.emit('chat', data);
    
      // save the new message to mongodb
      messageCollection.insert(data, function(err, result) {
        console.log(result);
      });
    });
  });
};

