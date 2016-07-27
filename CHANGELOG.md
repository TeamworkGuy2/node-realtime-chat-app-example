# Change Log
All notable changes to this project will be documented in this file.
This project does its best to adhere to [Semantic Versioning](http://semver.org/).


--------
### [0.2.1](N/A) - 2016-07-26
#### Changed
* Fixed some indentation, added some documentation, and prepped for knock-knock joke version of server.js


--------
### [0.2.0](https://github.com/TeamworkGuy2/browser-bundle-examples/commit/c24cdd57ae763b8a2df3f159ce536ed1277f4503) - 2016-07-26
#### Changed
* Refactored message format and types of messages (now includes 'query').
* Changed 'when' property from Date to timestamp


--------
### [0.1.2](https://github.com/TeamworkGuy2/node-realtime-chat-app-example/commit/58cb13ea7dc6e4bcb4c1ac47486528cdfcdfc5d8) - 2016-07-20
#### Added
Setup server.js for easier administration


--------
### [0.1.1](https://github.com/TeamworkGuy2/node-realtime-chat-app-example/commit/94b332cf32113316310d223650d512de0a5770d5) - 2016-07-19
#### Added
README.md and CHANGELOG.md

#### Fixed
Some path issues with server/server.js


--------
### [0.1.0](https://github.com/TeamworkGuy2/node-realtime-chat-app-example/commit/c02e93437afee290be71efcd6520549436dee7c1) - 2016-07-19
#### Added
Initial fork of original chat app

#### Changed
Should work out of the box with node.js, npm, and no other requirements

#### Removed
'redis' package requirement in favor of in-memory message storage (lost when server restarts) for now
