const {sequelize} = require('./db');
const {Kitten} = require('./');
const {kittens} = require('./seedData');
const {User} = require('./');
const {users} = require('./seedData');
const bcrypt = require('bcrypt');

const seed = async () => {
  await sequelize.sync({ force: true }); // recreate db
  await Kitten.bulkCreate(kittens);
  for (let i = 0; i < users.length; i++){
    users[i].password = await bcrypt.hash(users[i].password,5)
  }
  await User.bulkCreate(users);
};

module.exports = seed;
