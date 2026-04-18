const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox",
  client_id: "AaPvi3SH4yKV9gWxwUWenj6qLymZlckUuAZyEkzgMATBjswN4ZipKCkheZGFcPf_foJLqCqxxq06Ccs-",
  client_secret: "EP83uHxAFuEQx9l2NGYwkMhi-Thn4rSBl93DTX7rc1O3gl-IhnSyVkuMDER0NTKluhyBBOr7xP198sri",
});

module.exports = paypal;
