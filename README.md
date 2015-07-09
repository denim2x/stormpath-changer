# stormpath-changer

Stormpath-Changer is an extension for Stormpath that enables users of your application to easily change their password after logging in, being a potential solution to [this issue](https://github.com/stormpath/stormpath-express/issues/33) (besides [this pull request](https://github.com/stormpath/stormpath-express/pull/77)).


## Example

In this example, after logging in the user is redirected to the password-change page and then, after submitting the required passwords, he/she will be able to login using the new password.

```javascript
var express = require('express');
var stormpath = require('express-stormpath');
var changer = require('stormpath-changer');

const apiUrl = 'https://api.stormpath.com/v1/';

var app = express();
app.use(stormpath.init(app, {
    application: apiUrl + '<app_id>',
    secretKey: '<secret_key>',
    redirectUrl: '/change'
}));

changer.init(app, {
    enablePasswordChange: true,
    postPasswordChangeRedirectUrl: '/login'
});

app.listen(process.env.PORT || 80);
```


## Links

Below are some resources you might find useful!

- [express-stormpath documentation](http://docs.stormpath.com/nodejs/express/)
- [Stormpath website](https://stormpath.com)
- [15-Minute Tutorial: Build a Webapp with Node, Express, Bootstrap & Stormpath](https://stormpath.com/blog/build-nodejs-express-stormpath-app/)
- [Stormpath Node.js library](https://github.com/stormpath/stormpath-sdk-node)


## License

This project is open-source via the [MIT License](http://opensource.org/licenses/MIT).