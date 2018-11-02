const express = require('express');
const bodyParser = require('body-parser');
const ejs= require('ejs');
const session = require('express-session');
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const bcrypt = require('bcrypt');


// CONFIG dependencies
const app = express ();

app.set('view engine', 'ejs');
app.set('views', 'src/views')

app.use(express.static('public'));

const sequelize = new Sequelize("switchr",process.env.POSTGRES_USER,null,{
  host: 'localhost',
  dialect: 'postgres',
  port: 5433
})

app.use(bodyParser.urlencoded({extended: true}))


//Session

app.use(session({
  store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
    expiration: 24 * 60 * 60 * 1000 // The maximum age (in milliseconds) of a valid session.
  }),
  secret: "safe",
  saveUnitialized: true,
  resave: false
}))

//MODELS DEFINITION

const User = sequelize.define('users',{
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password:{
    type: Sequelize.STRING
  }
  },{
  timestamps: false
  });

  const Feedback = sequelize.define('feedbacks',{
    name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    message: {
      type: Sequelize.STRING,
    },
    },{
    timestamps: false
    });


// TABLES RELATIONSHIP/ASSOCIATION
// The tables are not related to one another
//Routes
// Home and sign in.
app.get('/signin', function(req,res){
  let user = req.session.user
  res.render('signin')
})

app.post('/signin', function (req, res) {

  let email = req.body.email;
	let password = req.body.password;

	console.log('Just to make sure I get: '+email+" "+password);

	if(email.length === 0) {
		res.redirect('/signin?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(password.length === 0) {
		res.redirect('/signin?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: email
		}
	}).then((user) => {
      console.log("AFTER THE THEN")
			if(email!== null && bcrypt.compareSync(password, user.password)){
        req.session.user = user;
				res.redirect('/profile');
			} else {
				res.redirect('/?message=' + encodeURIComponent('Invalid email or password.'));
			}


	})
  .catch(function(error){
    res.redirect('/signin')
  })
});

// Log Out
app.get('/logout', (req,res)=>{
  req.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		res.redirect('/');
	})
})

// SIGN up
app.get('/signup', function(req, res){
	res.render("signup");
})

app.post('/signup', function(req, res){

  let inputusername = req.body.username
  let inputemail = req.body.email
  let inputpassword = req.body.password
  let confirmpassword = req.body.confirmpassword


  if(inputusername.length<0){
    res.redirect('/signup?message=' + encodeURIComponent("Please enter your username"));
    return;
  }

  if(inputemail.length<0){
    res.redirect('/signup?message=' + encodeURIComponent("Please enter your email"));
    return;
  }


  if(inputpassword!==confirmpassword){
    res.redirect('/signup?message=' + encodeURIComponent("Your password doesn't match"));
    return;
  }

 if(inputpassword.length<8 || confirmpassword.length<8){
   res.redirect('/signup?message=' + encodeURIComponent("Your password is too short"));
   return;
 }


	console.log("I am receiving following user credentials: "+inputusername+" "+inputpassword);

      bcrypt.hash(inputpassword, 10).then((hash)=>{
			User.create({
				username: inputusername,
        email: inputemail,
				password: hash
			}).then( () => {
				res.redirect('/signin');
			})
      .catch(function(error){
        res.redirect('/signup')
      })
    })
})

// My Profile
app.get('/profile', (req,res)=>{

  const user = req.session.user;
  console.log(user)

  User.findOne({
  where: {
    id: user.id
  }
})
.then((returneduser) => {
  console.log(returneduser)
  res.render("profile", {user: returneduser});
})
});

// Contact Us
app.get('/contact', function(req, res){
	res.render("contact");
})

app.post('/contact', function(req, res) {

	let inputname = req.body.name;
	let inputemail = req.body.email;
  let inputmessage = req.body.message;

  Feedback.create({
			name: inputname,
      email: inputemail,
      message: inputmessage
		})
	.then(post => {
		res.redirect(`/contact`);
	})
});

// Product
app.get('/product', function(req, res){
	res.render("product");
})

// Home
app.get('/', function(req, res){
	res.render("home");
})

// About
app.get('/about', function(req, res){
	res.render("about");
})



sequelize.sync()

app.listen(3000, function(){
  console.log("App listening on port 3000")
})
