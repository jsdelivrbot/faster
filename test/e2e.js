var test  = require('tape');
var chalk = require('chalk');
var red = chalk.red, green = chalk.green, cyan = chalk.cyan;
var exec = require('child_process').exec;
var port = process.env.FASTER_PORT || 4242;
var secret = process.env.FASTER_SECRET || '1234'; // don't publish this
var terminate = require('terminate'); // knew this would come in handy! ;-)
var fs = require('fs');
// start SocketIO CLIENT so we can listen for the restart event
var ioclient = require('socket.io-client');
var socket;

var faster = require('../lib/');
var basedir = '/../';

test(cyan('Run Faster. Update a File. Listen for Re-Start Event. Close'), function(t){
  setTimeout(function(){
    faster(basedir, function(child){
      t.true(parseInt(child.pid, 10) > 0, green("✓ Child Process Running ") + cyan(child.pid))
      setTimeout(function(){
        socket = require('socket.io-client')('http://localhost:'+port);
        console.log(chalk.bgYellow.red.bold(" Socket.io Client Started "))
        socket.on('refresh', function(data) {
          console.log(chalk.bgYellow.red(data));
          t.equal(data, 'refresh', "✓ Refresh Signal Works (as expected)")
        });
      }, 500);

      var filename = __dirname + "/hai.txt";
      var time = new Date().getTime();
      fs.writeFile(filename, time, function(err){
        if(err) {
          console.log(err);
        }
        t.end();
        // soceket should receive a message here...
      });
      // update npm-debug.log
      filename = __dirname + "/setup/npm-debug.log";
      fs.writeFile(filename, time, function(err){
        if(err) {
          console.log(err);
        }
      });
    })
  },2000)
});

var Wreck = require('wreck');

test(cyan('Access Faster Server style.css and client.js'), function(t){
  Wreck.get('http://localhost:'+port+'/', function (err, res, payload) {
    t.equal(res.statusCode, 200, "✓ 200");
  });
  Wreck.get('http://localhost:'+port+'/client.js', function (err, res, payload) {
    t.true(payload.indexOf('function') > -1, "✓ client.js loaded");
  });
  Wreck.get('http://localhost:'+port+'/socket.io.js', function (err, res, payload) {
    t.true(payload.indexOf('function') > -1, "✓ client.js loaded");
  });
  Wreck.get('http://localhost:'+port+'/fail.html', function (err, res, payload) {
    // console.log(payload);
    t.equal(res.statusCode, 200, "✓ always 200");
    // t.end()
  });
  var ip = faster.ip;
  t.true(ip.length > 8, green("✓ IP Address is: ")+ip);
  t.end();
});

test(cyan('Shut Down Faster'), function(t){
  // delete the file we created
  var filename = __dirname + "/hai.txt"; // avoids adding it to github...
  fs.unlinkSync(filename);
  setTimeout(function() {
    socket.disconnect();
    faster.terminate(function(err, running) {
      console.log('err:', err, 'done:', running)
      t.ok(!running, green("✓ Cleanup Complete"))
      t.end();
    });
  },2000);
});
