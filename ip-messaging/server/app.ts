/// <reference path="../typings/main.d.ts" />
/*
Load Twilio & Virgil configuration from .env config file - the following environment
variables should be set:

process.env.TWILIO_ACCOUNT_SID
process.env.TWILIO_API_KEY
process.env.TWILIO_API_SECRET
process.env.TWILIO_IPM_SERVICE_SID

*/
require("dotenv").load();

import * as express from "express";
import * as path from "path";

let VirgilSDK = require('virgil-sdk');
let AccessToken = require('twilio').AccessToken;
let IpMessagingGrant = AccessToken.IpMessagingGrant;

const root =  path.resolve('./public');
const app: express.Application = express();
app.disable("x-powered-by");

app.use(express.static(root));
app.use('/assets/', express.static('./node_modules/'));

/*
Authenticate a chat member by generating an Access tokens. One for Virgil SDK and the 
second one for Twilio IP messaging client.
*/
app.get('/auth', function (request, response) {
    var identity = request.query.identity;
    var validationToken = getValidationToken(identity);

    response.send({
        identity: identity,        
        validation_token: validationToken
    });
});

app.get('/twilio-token', function (request, response) {
    var appName = 'VIRGIL_CHAT';
    var identity = request.query.identity;
    var deviceId = request.query.device;
    var twilioToken = getTwilioToken(appName, identity, deviceId);

    response.send({
        twilio_token: twilioToken.toJwt()
    });
});

app.get('/virgil-token', function (request, response) {
    var virgilToken = process.env.VIRGIL_ACCESS_TOKEN;

    response.send({
        virgil_token: virgilToken
    });
});

app.get('*', function (req, res, next) {
    if (req.accepts('html')) {
        res.sendFile(root + '/index.html');
    }
    else {
        next();
    }
});

app.listen(3000, function () {

});

function getTwilioToken(appName, identity, deviceId) {

    // Create a unique ID for the client on their current device
    var endpointId = appName + ':' + identity + ':' + deviceId;

    // Create a "grant" which enables a client to use IPM as a given user,
    // on a given device
    var ipmGrant = new IpMessagingGrant({
        serviceSid: process.env.TWILIO_IPM_SERVICE_SID,
        endpointId: endpointId
    });

    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    var token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET
    );

    token.addGrant(ipmGrant);
    token.identity = identity;

    return token;
}

function getValidationToken(identity) {
    var privateKey = new Buffer(process.env.VIRGIL_APP_PRIVATE_KEY, 'base64').toString();

    // This validation token is generated using app’s Private Key created on
    // Virgil Developer portal.
    var validationToken = VirgilSDK.utils.generateValidationToken(identity,
        'nickname',
        privateKey,
        process.env.VIRGIL_APP_PRIVATE_KEY_PASSWORD);

    return validationToken;
}