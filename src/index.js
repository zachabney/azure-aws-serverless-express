import awsServerlessExpress from 'aws-serverless-express';
import url from 'url';

function getAzureCookies(headers) {
  const cookies = Object.entries(headers)
    .filter(([key, value]) => key.toLowerCase() === 'set-cookie')
    .map(([key, value]) => {
      const azureCookieObject = value.split(';')
        .reduce((azureCookieObject, cookieProperty, index) => {
          const [key, value] = cookieProperty.split('=')

          const sanitizedKey = key.toLowerCase().trim()
          const sanitizedValue = value && value.trim()

          if (index === 0) {
            azureCookieObject.name = sanitizedKey
            azureCookieObject.value = sanitizedValue
            return azureCookieObject
          }

          // https://github.com/Azure/azure-functions-nodejs-worker/blob/67941a159bf893b9459fd9a9bbdd691f8ba10838/types/public/Interfaces.d.ts#L120-L143
          switch (sanitizedKey) {
            case 'expires':
              azureCookieObject.expires = new Date(sanitizedValue)
              break
            case 'secure':
              azureCookieObject.secure = true
              break
            case 'httponly':
              azureCookieObject.httpOnly = true
              break
            case 'samesite':
              azureCookieObject.sameSite = sanitizedValue
              break
            case 'maxage':
              azureCookieObject.maxAge = sanitizedValue
              break
            default:
              azureCookieObject[sanitizedKey] = sanitizedValue
          }

          return azureCookieObject
        }, {})

        return azureCookieObject
    })

  return cookies
}

export default function azureFunctionHandler(app, binaryTypes) {
  binaryTypes = binaryTypes || ['*/*'];

  const server = awsServerlessExpress.createServer(app, undefined, binaryTypes);

  return (context, req) => {
    const path = url.parse(req.originalUrl).pathname;

    const event = {
      path: path,
      httpMethod: req.method,
      headers: req.headers || {},
      queryStringParameters: req.query || {},
      body: req.rawBody,
      isBase64Encoded: false
    };

    const awsContext = {
      succeed(awsResponse) {
        context.res.status = awsResponse.statusCode;
        const headers = {
          ...context.res.headers,
          ...awsResponse.headers
        };
        context.res.body = Buffer.from(
          awsResponse.body,
          awsResponse.isBase64Encoded ? 'base64' : 'utf8'
        );

        context.res.isRaw = true;
        context.res.cookies = getAzureCookies(headers)
        context.res.headers = Object.entries(headers)
          .filter(([key, value]) => key.toLowerCase() !== 'set-cookie')
          .reduce((headers, [key, value]) => {
            headers[key] = value
            return headers
          }, {})

        context.done();
      }
    };
    awsServerlessExpress.proxy(server, event, awsContext);
  };
}
