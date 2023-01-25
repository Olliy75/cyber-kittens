const express = require('express');
const app = express();
const { User, Kitten } = require('./db');
require("dotenv").config();
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const { kittens } = require('./db/seedData');

const salt_count = 5;



// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

const setUser = (req,res,next)=>{
  try{
    const auth = req.header("Authorization")
    if (!auth){
      next()
    }else{
      const token = auth.split(" ")[1]
      const user = jwt.verify(token,process.env.JWT_SECRET)
      req.user = user
      next()
    }
  }catch(error){
    console.log(error)
    next(error)
  }
}

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(setUser)

app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password
app.post("/register", async (req,res,next)=>{
  try{
    const hashed = await bcrypt.hash(req.body.password,salt_count)
    const user = await User.create({username: req.body.username, password: hashed})
    const token = jwt.sign({id:user.id, username:req.body.username},process.env.JWT_SECRET)
    res.send({message: "success", token:token})
  }catch (error){
    console.log(error)
    next(error)
  }
})


// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB
app.post('/login', async (req,res,next)=>{ 
  try{
    const user = await User.findOne({where: {username: req.body.username}});
    const ismatch = await bcrypt.compare(req.body.password,user.password)
    if (ismatch){
      const token = jwt.sign({id:user.id, username:req.body.username},process.env.JWT_SECRET)
      res.send({message: "success", token:token})
    }
    else{
      res.status(401).send("Unauthorized");
    }
  } catch (error){
    console.log(error)
    next(error)
  }
 
})
// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get('/kittens/:id', async (req,res,next)=>{
  try{
         // comes from the logged in user 
    if (req.user == undefined) {
      res.sendStatus(401); 
    } else if (req.params.id != req.user.id) {
      res.sendStatus(401); 
    } else {
      const cat = await Kitten.findOne({ where: { ownerId: req.user.id } })
      res.send({age:cat.age,color:cat.color,name:cat.name})
    }
  }catch (error){
    console.log(error)
    next(error)
  }
})
// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post('/kittens', async (req,res,next)=>{
  try{
    if(req.user == undefined)
    {
      res.sendStatus(401)
    }
    const cat = await Kitten.create({name: req.body.name, age: req.body.age, color:req.body.color})
    //const owner = await User.findByPk(req.user)
    //cat.addUser(owner)
    res.status(201).send({name: req.body.name, age: req.body.age, color:req.body.color});
    }
    catch (error){
    console.log(error)
    next(error)
  }
})
// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete('/kittens/:id', async (req,res,next)=>{
  try{
    if(req.user == undefined)
    {
      res.sendStatus(401)
    }else if (req.params.id != req.user.id) {
      res.sendStatus(401); 
    } else {
    const cat = await Kitten.findOne({ where: { ownerId: req.user.id } })
    await cat.destroy()
    res.sendStatus(204)
    }
    }
    catch (error){
    console.log(error)
    next(error)
  }
})
// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
