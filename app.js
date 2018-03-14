const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const config = require('./config.js');

paypal.configure({
  'mode': 'sandbox',   //sandbox or live
  'client_id': config.client_id,
  'client_secret': config.secret
});

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "item",
                "sku": "sku",
                "price": "25.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "25.00"
        },
        "description": "This is the payment description."
    }]
};


  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log("error: ", error);
          throw error;
      } else {
          console.log("Create Payment Response");
          console.log(payment);
          for (let i = 0; i < payment.links.length; i++) {
            if(payment.links[i].rel === 'approval_url') {
              res.redirect(payment.links[i].href);
            }
          }
      }
  });

});  //end pay route

// route for success below

app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;  //from success URL from PayPal
  const paymentId = req.query.paymentId; //from success URL from PAYPAL


  const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": "25.00"
          }
      }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log("Get Payment Response");
          console.log(JSON.stringify(payment));
          res.send("Success");
      }
  });

});


app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(3000, () => console.log('Server Started, listening port 3000'));
