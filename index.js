var express = require("express");
var app = express();
var https = require("https");
var fs = require("fs");
var bodyParser = require("body-parser");
var nedb = require("nedb");
var db = new nedb({ filename: 'users.db', autoload: true });

app.use("/", express.static("public"));

app.post("/push/subscribe", bodyParser.json(), function(req, res) {
    // We've received a push user from Web Push
    var subscription = req.body;

    if (subscription.endpoint.indexOf('https://android.googleapis.com/gcm/send')==0) {
        // It's Google Chrome with GCM - deprecated
        // However, there are still some browsers out there using this technique
        endpointParts = subscription.endpoint.split('/');
        registrationId = endpointParts[endpointParts.length-1];
        endpoint = 'https://android.googleapis.com/gcm/send';
        savePushUser('gcm', subscription.endpoint, registrationId, null);
    } else {
        // It's a Web Push end point - STANDARD SYSTEM TODAY
        savePushUser('webpush', subscription.endpoint, null, subscription.keys);
    }
    res.writeHead(200);
    res.write("OK");
});

function savePushUser(type, endpoint, id, keys) {
    db.count({ endpoint: endpoint }, function(err, count) {
        if (count==0) {
            // It's a new user
            var pushUser = {
                type: type,
                endpoint: endpoint,
                keys: keys
            };
            db.insert(pushUser, function(err) {
                if (err) {
                    console.log(err);   
                } else {
                    console.log("New user saved");
                }
            });
        } else {
            console.log("The user was already in the system");   
        }
    });
}


var server = app.listen(4000, function() {
  var host = server.address().address=="::" ? "localhost" : server.address().address;
  var port = server.address().port;

  console.log('Open browser at http://%s:%s', host, port);
});