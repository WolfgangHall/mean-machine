var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 8080;

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

apiRouter.use(function(req, res, next){
  console.log('Somebody just came to our app');

  next();
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

 app.use('/api', apiRouter);

 app.listen(port);
 console.log("Magin on " + port);