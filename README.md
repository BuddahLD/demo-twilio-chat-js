# Virgil & Twilio IP Messaging

With these instructions, you'll learn how to install and integrate the Virgil Security to Twilio IP messaging API.

## Publish

There are only few steps required to setup Virgil History service :)

```
$ cd ./ip-messaging

$ npm install
$ npm start
```

## Configuration

```
$ cp .env.example .env
```
Set Twilio & Virgil environment variables declared in `.env` file.

| Variable Name                     | Description                    |
|-----------------------------------|--------------------------------|
| TWILIO_ACCOUNT_SID                | Your primary Twilio account identifier - [find this in the console here.](https://www.twilio.com/user/account/ip-messaging)        |
| TWILIO_API_KEY                    | Used to authenticate - [generate one here](https://www.twilio.com/user/account/ip-messaging/dev-tools/api-keys). |
| TWILIO_API_SECRET                 | Used to authenticate - just like the above, [you'll get one here.](https://www.twilio.com/user/account/ip-messaging/dev-tools/api-keys) |
| TWILIO_IPM_SERVICE_SID            | A service instance where all the data for our application is stored and scoped. [Generate one in the console here.](https://www.twilio.com/user/account/ip-messaging/services) |
| VIRGIL_ACCESS_TOKEN               |  |
| VIRGIL_APP_PRIVATE_KEY            | Used to generate **Validation Token**, which is required to publish authorized **Public Keys** to Virgil Keys Service.  |
| VIRGIL_APP_PRIVATE_KEY_PASSWORD   |            |
| APP_CHANNEL_ADMIN_CARD_ID         |                   |
| APP_CHANNEL_ADMIN_PRIVATE_KEY     |           |

## Quick start guide
To review the changes required to use Virgil Security's security infrastructure with Twilio IP Messaging please visit [this document](https://github.com/VirgilSecurity/virgil-demo-twilio/tree/master/ip-messaging).
