'use strict';

var csrf = require('csurf');
var forms = require('forms');

var fields = forms.fields;
var validators = forms.validators;


var form = forms.create({
  old_password: fields.password({ required: validators.required('Current password is required.') }),
  password: fields.password({ required: validators.required('New password is required.') }),
  passwordAgain: fields.password({ required: validators.required('New password is required.') })
});

var change = function (req, res) {
  var view = req.app.get('stormpathPasswordChangeView');
  res.locals.csrfToken = req.csrfToken();

  helpers.getUser(req, res, function () {
    var user = req.user;
    form.handle(req, {
      // If we get here, it means the user is submitting a password change
      // request, so we should attempt to change the user's password.
      success: function (form) {
        req.app.get('stormpathApplication').authenticateAccount({
          username: user.username,
          password: form.data.old_password
        }, function (err, result) {
          if (err) {
            helpers.render(view, res, {error: err.userMessage, form: form});
            req.app.get('stormpathLogger').info('User attempted to authenticated via the password change page, but supplied the wrong password.');
          } else {
            if (form.data.password !== form.data.passwordAgain) {
              helpers.render(view, res, {error: 'Passwords do not match.', form: form});
            } else {
              user.password = form.data.password;
              user.save(function(err, updatedAccount) {
                if (err) {
                  helpers.render(view, res, {error: err.userMessage, form: form});
                  req.app.get('stormpathLogger').info('A user attempted to change their password, but the password change itself failed.');
                } else {
                  if (req.app.get('stormpathEnablePasswordChangeAutoLogin')) {
                    req.stormpathSession.user = result.account.href;
                    res.locals.user = result.account;
                    req.user = result.account;
                  }

                  res.redirect(req.app.get('stormpathPostPasswordChangeRedirectUrl'));
                }
              });
            }
          }
        })
      },

      // If we get here, it means the user didn't supply required form fields.
      error: function (form) {
        // Special case: if the user is being redirected to this page for the
        // first time, don't display any error.
        if (form.data && !form.data.old_password && !form.data.password && !form.data.passwordAgain) {
          helpers.render(view, res, {form: form});
        } else {
          var formErrors = helpers.collectFormErrors(form);
          helpers.render(view, res, {form: form, formErrors: formErrors});
        }
      },

      // If we get here, it means the user is doing a simple GET request, so we
      // should just render the password change template.
      empty: function (form) {
        helpers.render(view, res, {form: form});
      }
    });
  });
};

var changeDone = function (req, res) {
  helpers.render(req.app.get('stormpathPasswordCompleteView'), res);
};

module.exports.init = function(app, opts) {
  opts = opts || {};

  app.set('stormpathEnablePasswordChange', opts.enablePasswordChange || (process.env.STORMPATH_ENABLE_PASSWORD_CHANGE === 'true') || false);
  app.set('stormpathEnablePasswordChangeAutoLogin', opts.enablePasswordChangeAutoLogin || (process.env.STORMPATH_ENABLE_PASSWORD_CHANGE_AUTO_LOGIN === 'true') || false);
  app.set('stormpathPasswordChangeView', opts.passwordChangeView || process.env.STORMPATH_PASSWORD_CHANGE_VIEW || __dirname + '/view.jade');
  app.set('stormpathPasswordChangeUrl', opts.passwordChangeUrl || process.env.STORMPATH_PASSWORD_CHANGE_URL || '/change');
  app.set('stormpathPostPasswordChangeRedirectUrl', opts.postPasswordChangeRedirectUrl || process.env.STORMPATH_POST_PASSWORD_CHANGE_REDIRECT_URL || '/change/done');

  var urlMiddleware = function(req, res, next) {
    res.locals.url = req.protocol + '://' + req.get('host');
    next();
  };
  var csrfMiddleware = csrf({ sessionKey: 'stormpathSession' });
  var router = app._router.stack.filter(function (layer) {
    return layer.name == 'router';
  })[0].handle;

  if (app.get('stormpathEnablePasswordChange')) {
    router.use(app.get('stormpathPasswordChangeUrl'), urlMiddleware);
    router.use(app.get('stormpathPostPasswordChangeRedirectUrl'), urlMiddleware);
    router.use(app.get('stormpathPasswordChangeUrl'), csrfMiddleware);

    router.get(app.get('stormpathPasswordChangeUrl'), change);
    router.post(app.get('stormpathPasswordChangeUrl'), change);
    router.get(app.get('stormpathPostPasswordChangeRedirectUrl'), changeDone);
  }
};