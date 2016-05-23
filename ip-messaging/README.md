# Quickstart. Adding end-to-end encryption to Twilio IP Messaging.

## Introducing

With these instructions, you'll learn how to install and integrate the Virgil Security to Twilio IP messaging API. Sounds like a plan? Then let’s get cracking!

## How it works
![IPMessaging](https://github.com/VirgilSecurity/virgil-demo-twilio/blob/master/Images/how-it-works.png)

##Prerequisites
 
### Obtaining an Access Token
 
First you must create a free Virgil Security developer's account by signing up [here](https://developer.virgilsecurity.com/account/signup). Once you have your account you can [sign in](https://developer.virgilsecurity.com/account/signin) and generate an access token for your application.
 
The access token provides authenticated secure access to Virgil Keys Services and is passed with each API call. The access token also allows the API to associate your app’s requests with your Virgil Security developer's account.
 
Use this token to initialize the SDK client [here](#lets-get-started).
 
### Install
 
You can easily add SDK dependency to your project, just follow the examples below:
 
#### NPM
 
```sh
npm install virgil-sdk
```
 
#### Bower
```sh
bower install virgil-sdk
```
  
#### CDN
```html
<script 
src="https://cdn.virgilsecurity.com/packages/javascript/sdk/1.4.6/virgil-sdk.min.js" 
integrity="sha256-6gsCF73jFoEAcdAmVE8n+LCtUgzQ7j6svoCQxVxvmZ8="
crossorigin="anonymous"></script>
```

Use the code below to initialize global variable of VirgilSDK.

```js
var virgil = new VirgilSDK("%ACCESS_TOKEN%");
```

## Let's Get Started

In a Twilio IP Messaging application, a Channel is where all the action happens. Whether it's between two users or two hundred, a Channel is where Messages are sent, received, and archived for later viewing by offline clients.

Let's dive into a few of the key techniques you'll need to employ while working with Channels and Messages in your application. Let's also apply end-to-end encryption using Virgil Security's infrastructure.

### Generate a new key pair
Generate a new public private key pair for end-to-end encryption
```js
var keyPair = virgil.crypto.generateKeyPair('KEYS_PASSWORD_GOES_HERE');
```

### Publish a Public Key

Publish a Public Key to the Virgil Keys Service where they are available in an open access for other users (e.g. recipient) to verify and encrypt the data for the key owner. See more about publishing Public Keys [here...](https://virgilsecurity.com/api-docs/javascript/keys-sdk#cards-and-public-keys)

```js
var options = {
     public_key: keyPair.publicKey,
     private_key: keyPair.privateKey,
     identity: {
         type: 'member',
         value: identity,
         validation_token: '%VALIDATION_TOKEN%'
     }
};

virgil.cards.create(options).then(function (card){

    // returned a card with represents a Public Key.
    myCard = card;
});
```

### Create a Channel
Before you can start sending Messages, you first need a Channel. Here is how you create a Channel.

```js
// Create a Channel
twilioClient.createChannel({
    friendlyName: 'general'
}).then(function(channel) {
    
    // channel has been successfully created.
    generalChannel = channel;
});
```

### Send encrypted Messages
Once you're a member of a Channel, you can send a Message to it. A Message is a bit of data that is sent first to the Twilio backend, where it is stored for later access by members of the Channel, and then pushed out in real time to all currently online Channel members. Only users subscribed to your Channel will receive your Messages.

```js
// Receive the list of Channel's recipients
Promise.all(generalChannel.getMembers().map(function(member) {
    
    // Search for the member’s cards on Virgil Keys service
    return virgil.cards.search({ 
        value: member.identity,
        type: 'member'
    }).then(function(cards){
        return { 
            recipientId: cards[0].id, 
            publicKey: cards[0].public_key.public_key
        };
    });
    
}).then(function(recipients) {
    var msg = $('#chat-input').val();
    
    var encryptedMsg = virgil.crypto.encryptStringToBase64(
        msg, 
        recipients
    );
        
    generalChannel.sendMessage(encryptedMsg);    
});
```

Today, a Message is just a string of text. In the future, this may expand to include other media types such as images and binary data. For now, in addition to text Messages, you might get crafty and use JSON serialized text to send rich data over the wire in your application.

### Receive encrypted Messages
You can also be notified of any new incoming Messages with an event handler. This is likely where you would handle updating your user interface to display new Messages.

```js
// Listen for new Messages sent to a Channel
generalChannel.on('messageAdded', function(message) {
    
    // Decrypt the Message using card id and private key values.
    var decryptedMessage = virgil.crypto.decryptStringFromBase64(
        message.body, 
        myCard.id, 
        keyPair.privateKey
    );
        
    console.log(message.author, decryptedMessage);
});
```
