# azure-aws-serverless-express

Wrapper library to use aws-serverless-express with Azure Functions.

Note: This is a fork of [bigx333's library](https://github.com/bigx333/azure-aws-serverless-express) that adds support for setting multiple cookies at a time using the [context cookies object](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=v2#response-object).

## Installation

```sh
npm install azure-aws-serverless-express --save
```

## Usage

```javascript
const express = require('express');
const azureFunctionHandler = require('@zachabney/azure-aws-serverless-express');

const app = express();

app.get('/api/hello-world/', (req, res) => res.send('Hello World!'));

module.exports = azureFunctionHandler(app);
```

```
$ curl http://localhost:7071/api/hello-world/
Hello World!
```

## Todo

Tests
