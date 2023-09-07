
const mongoose = require('mongoose');
const config = require('config-lite');
const chalk=require('chalk');
mongoose.connect(config.url);
mongoose.Promise=global.Promise;

const db=mongoose.connection;

db.once('open',()=>{
    console.log(chalk.green('连接数据库成功'));
})

db.on('error',(err)=>{
    console.error(chalk.red('mongodb连接错误'+err));
    mongoose.disconnect();
})

db.on('close',()=>{
    console.log('数据库断开，重新连接数据库');
    mongoose.connect(config.url);
})



module.exports=db;