var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var port = process.env.PORT || 8080;
var superSecret = 'themanwhosoldtheworld';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

app.use(logger('dev'));

var User = require('./app/models/user');

mongoose.connect('mongodb://localhost/userRegistration');

app.get('/', function(req, res){
  res.send('welcome to the home page');
});

var apiRouter = express.Router();

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRouter.post('/authenticate', function(req, res) {

  // find the user
  // select the name username and password explicitly
  User.findOne({
    username: req.body.username
  }).select('name username password').exec(function(err, user) {

    if (err) throw err;

    // no user with that username was found
    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {
    // check if password matches
    var validPassword = user.comparePassword(req.body.password);
    if (!validPassword) {
      res.json({ success: false, message: 'Authentication failed. Wrong password.' });
    } else {

    // if user is found and password is right, create a token
    var token = jwt.sign({
      name: user.name,
      username: user.username
    }, superSecret, {
      expiresIn: "24h" // expires in 24 hours
    });

    // return the information including token as JSON
    res.json({
      success: true,
      message: 'Enjoy your token!',
      token: token
    });
   }
  }
 });
});

apiRouter.use(function(req, res, next){
  console.log('Somebody just came to our app');

  next();
});

// route middleware to verify a token
apiRouter.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.params.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, superSecret, function(err, decoded) {
      if (err) {
        return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;

        next();

      }
    });

  } else {

    // if there is no token
    // return an HTTP response of 403 (access forbidden) and an error message
    return res.status(403).send({ success: false, message: 'No token provided.'
 });

  }
  // next() used to be here
});

apiRouter.get('/', function(req, res){
  res.json({message: 'hooray! welcome to the api!'});
});

apiRouter.route('/users')

   // create a user (accessed at POST http://localhost:8080/api/users)
    .post(function(req, res) {

   // create a new instance of the User model
      var user = new User();

   // set the users information (comes from the request)
      user.name = req.body.name;
      user.username = req.body.username;
      user.password = req.body.password;

   // save the user and check for errors
      user.save(function(err) {
        if (err) {
   // duplicate entry
          if (err.code == 11000)
            return res.json({ success: false, message: 'A user with that username already exists. '});
          else
            return res.send(err);
        }

        res.json({ message: 'User created!' });
    });
  })
  .get(function(req, res){
    User.find(function(err, users){
      if (err) res.send(err);

      res.json(users);
    });
  });

apiRouter.route('/users/:user_id')
  .get(function(req, res){
    User.findById(req.params.user_id, function(err, user){
      if (err) res.send(err);

      res.json(user);
    });
  })
  .put(function(req, res) {

 // use our user model to find the user we want
    User.findById(req.params.user_id, function(err, user) {

      if (err) res.send(err);

      // update the users info only if its new
      if (req.body.name) user.name = req.body.name;
      if (req.body.username) user.username = req.body.username;
      if (req.body.password) user.password = req.body.password;

 // save the user
      user.save(function(err) {
        if (err) res.send(err);

 // return a message
        res.json({ message: 'User updated!' });
      });
    });
  })
  .delete(function(req, res){
    User.remove({
      _id: req.params.user_id
    }, function(err, user){
      if (err) res.send(err);

      res.json({message: 'Successfully deleted'});
    });
  });

apiRouter.get('/me', function(req, res){
  res.send(req.decoded);
});

 app.use('/api', apiRouter);

 app.listen(port);
 console.log("Magin on " + port);