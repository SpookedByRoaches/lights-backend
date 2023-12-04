# lights-backend
An API mediator between the frontend site of the lights project and the MQTT broker.

## What does it do?
The idea is to have a service that can securely connect to the broker to control the devices in the smart home. It would also provide an easier method of communication since all you have to do is send HTTP requests as opposed to MQTT or websockets or whatever.

## How does it do that?
It uses express as the router since it's a simple app. It uses passport as the authenticator since it's easy to use. Uses the local strategy since that is secure enough, and the JWT instead of the session since that is the default. 