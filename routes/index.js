var express = require('express');
var router = express.Router();
var userModule = require('../modules/user')
var passcatModel = require('../modules/password_category');
var passModel = require('../modules/add_password');
var bcrypt =require('bcryptjs');
var jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
var getPasswordCategory = passcatModel.find({});
var getAllPass= passModel.find({});


/* GET home page. */
var msg = '';



if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

function checkLoginUser(req,res,next){
  var userToken=localStorage.getItem('userToken');
  try {
    var decoded = jwt.verify(userToken, 'loginToken');
  } catch(err) {
    res.redirect('/');
  }
  next();
}

function checkEmail(req,res,next){
  var email = req.body.email;
  var checkexistEmail = userModule.findOne({email:email});
  checkexistEmail.exec((err,data)=>{
if(err) throw err;
if(data){
  return res.render('signUp', { title: 'Registration Page', msg: 'Email Allready Exists !' });
}
next();
  });
}

function checkUsername(req,res,next){
  var username = req.body.uname;
  var checkexistUsername = userModule.findOne({username:username});
  checkexistUsername.exec((err,data)=>{
if(err) throw err;
if(data){
  return res.render('signUp', { title: 'Registration Page', msg: 'Username Allready Exists !' });
}
next();
  });
}

router.get('/', function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  if(loginUser){
    res.redirect('./dashboard');
  }else{
  res.render('index', { title: 'Password Managment System' , msg: ''});
  }
});

router.post('/', function(req, res, next) {
  var username = req.body.uname;
  var password = req.body.password;
  var checkUser = userModule.findOne({username: username});
  checkUser.exec((err,data)=>{
    if(err) throw err;
    var getUserID=data._id;
    var getPassword = data.password;
    if(bcrypt.compareSync(password,getPassword)){
      var token = jwt.sign({ userID: getUserID }, 'loginToken');
      localStorage.setItem('userToken', token);
       localStorage.setItem('loginUser', username);
       res.redirect('/dashboard');
    }
    else {
    res.render('index', { title: 'Password Managment System', msg: 'Invalid Username and Password !' });
    }
  });
  
});

router.get('/dashboard', checkLoginUser,function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  res.render('dashboard', { title: 'Dashboard',loginUser: loginUser, msg: '' });
});

router.get('/signUp', function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  if(loginUser){
    res.redirect('./dashboard');
  }else{
  res.render('signUp', { title: 'Registration Page', msg: '' });
  }
});

router.post('/signUp',checkUsername,checkEmail,function(req, res, next) {
  var username=req.body.uname;
  var email= req.body.email;
  var password= req.body.password;
  var confpassword= req.body.confpassword;
  if(password != confpassword){
    res.render('signUp', { title: 'Password Management System', msg:'Password Not Matched !' });
  } else {
    password =bcrypt.hashSync(req.body.password,10);
  var userDetails= new userModule({
    username: username,
    email: email,
    password: password
  });
userDetails.save((err,doc)=>{
  if(err) throw err;
  res.render('signUp', { title: 'Password Management System', msg:'User Registerd Successfully' });
});
  }
});

router.get('/passwordCategory',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  getPasswordCategory.exec(function(err,data){
    if(err) throw err;
  res.render('passwordCategory', { title: 'Password Category' , loginUser:loginUser , records: data });
  });
});

router.get('/passwordCategory/delete/:id',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  var passCat_id = req.params.id
  var passwordDelete = passcatModel.findByIdAndDelete(passCat_id);
  passwordDelete.exec(function(err){
    if(err) throw err;
     res.redirect('/passwordCategory');
  });
});

router.get('/passwordCategory/edit/:id',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  var passCat_id = req.params.id
  var getpasswordCategoryies = passcatModel.findById(passCat_id);
  getpasswordCategoryies.exec(function(err,data){
    if(err) throw err;
    res.render('editPasswordCategory', { title: 'Password Category' , loginUser:loginUser  ,error:'', success:'', records: data ,id:passCat_id});
  });
});

router.post('/passwordCategory/edit/',checkLoginUser, function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  var passcat_id=req.params.id;
    var passwordCategory=req.body.passwordCategory;
   var update_passCat= passcatModel.findOneAndUpdate(passcat_id,{password_category:passwordCategory});
   update_passCat.exec(function(err,doc){
      if(err) throw err;
   
  res.redirect('/passwordCategory');
    });
});


router.get('/editPasswordCategory', checkLoginUser,function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
    res.render('editPasswordCategory', { title: 'Add New Password Category',loginUser:loginUser,error:'', success:'' });
});


router.get('/addNewCategory', checkLoginUser,function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
    res.render('addNewCategory', { title: 'Add New Password Category',loginUser:loginUser,error:'', success:'' });
});

router.post('/addNewCategory', checkLoginUser,[check('passwordCategory','Enter Password Category Name').isLength({min: 1})],function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
  const error = validationResult(req);
  if(!error.isEmpty()){
    console.log(error.mapped());
    res.render('addNewCategory', { title: 'Add New Password Category',loginUser:loginUser,error:error.mapped(), success:'' });
  } else {
    var passcatName = req.body.passwordCategory;
    var passCatDetails = new passcatModel({
      password_category: passcatName
    });
    passCatDetails.save(function(err,doc){
      if(err) throw err;
      res.render('addNewCategory', { title: 'Add New Password Category',loginUser:loginUser, error:'' , success: 'Password Category Insert Sucessfully !!'});
    });
    
  }
 
});

router.get('/addNewPassword', checkLoginUser, function(req, res) {
  var loginUser = localStorage.getItem('loginUser');
  getPasswordCategory.exec(function(err,data){
    if(err) throw err;
    res.render('addNewPassword', { title: 'Password Management System', loginUser: loginUser, records: data, success:''});
      });
});
router.post('/', checkLoginUser,function(req, res, next) {
  var loginUser=localStorage.getItem('loginUser');
var pass_cat= req.body.pass_cat;
var project_name= req.body.project_name;
var pass_details= req.body.pass_details;
var password_details= new passModel({
password_category:pass_cat,
project_name:project_name,
password_detail:pass_details
});
  
password_details.save(function(err,doc){
  getPassCat.exec(function(err,data){
    if(err) throw err;
  res.render('addNewPassword', { title: 'Password Management System',loginUser: loginUser,records: data,success:"Password Details Inserted Successfully"});

});

  });
  });
router.get('/view-all-password', checkLoginUser,function(req, res, next) {

  var loginUser=localStorage.getItem('loginUser');
  
    
  var options = {
    offset:   1, 
    limit:    3
};

  passModel.paginate({},options).then(function(result){
 //console.log(result);
  res.render('view-all-password', { title: 'Password Management System',
  loginUser: loginUser,
  records: result.docs,
  current: result.offset,
  pages: Math.ceil(result.total / result.limit) 
});

});
});
router.get('/view-all-password/:page',checkLoginUser, function(req, res, next) {
   
  var loginUser=localStorage.getItem('loginUser');

  var perPage = 3;
  var page = req.params.page || 1;

  getAllPass.skip((perPage * page) - perPage)
  .limit(perPage).exec(function(err,data){
if(err) throw err;
passModel.countDocuments({}).exec((err,count)=>{    
res.render('view-all-password', { title: 'Password Management System',
loginUser: loginUser,
records: data,
  current: page,
  pages: Math.ceil(count / perPage) 
});
  });
});
});


router.get('/logout', function(req, res, next) {
  localStorage.removeItem('userToken');
  localStorage.removeItem('loginUser');
  res.redirect('/');
});

module.exports = router;
