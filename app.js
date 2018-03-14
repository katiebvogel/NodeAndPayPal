const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const config = require('./config.js');
const bodyParser = require('body-parser');


const client_id = config.client_id;
const secret = config.client_secret;



paypal.configure({
  'mode': 'sandbox',   //sandbox or live
  'client_id': client_id,
  'client_secret': secret
});

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

// app.get('/item', function (req, res) {
//   res.render('item', { item: req.body.item});
// });

app.post('/pay', (req, res) => {
  const data = req.body;

  console.log("request.body", data);
  console.log("data.price", data.price);
  console.log("data.item", data.item);
  console.log("data.qty", data.qty);
  const quantity = parseInt(data.qty);
  console.log("quantity ", quantity);

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
                "name": data.item,
                "sku": "sku",
                "price": data.price,
                "currency": "USD",
                "quantity": data.qty
            }]
        },
        "amount": {
            "currency": "USD",
            "total": data.price
        },
        "description": data.description
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
