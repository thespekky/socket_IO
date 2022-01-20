const http=require('http');
const express=require('express');
var session=require('express-session');
const ejs=require('ejs');
const socketio=require('socket.io');
const mysql=require('mysql');
const {joinUser,getRoomUsers,userLeave,getCurentUser}=require('./utils/users.js');
const {fromatmessage}=require('./utils/messages.js');
const app=express();
const server=http.createServer(app);
const port=3000;
const io=socketio(server);
const moment=require('moment');

const pool=mysql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'214szft_socket'
});


app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:true
}));

pool.getConnection((err,connection)=>{
    if(err)throw err;
    console.log("Connected to database Connid:"+connection.threadId);
});

app.get('/',(req,res)=>{
    let hiba="";
    res.render('index',{hiba});
});
app.get('/register',(req,res)=>{
    let hiba='';
    res.render("register",{hiba});
});
app.post('/reg',(req,res)=>{
    let hiba='';
    let username=req.body.username;
    let passwd1=req.body.passwd1;
    let passwd2=req.body.passwd2;
    pool.query(`SELECT * FROM users WHERE username='${username}'`,(err,results)=>{
        if(err)throw err;
        if(results.length!=0)
        {
            hiba='A felhasználó létezik';
            res.render('register',{hiba});
        }
        else
        {
            if(passwd1!=passwd2)
            {
                hiba='A jelszó nem egyezik';
                res.render('register',{hiba});
            }
            else
            {
                pool.query(`INSERT INTO users (username, password) VALUES ('${username}','${passwd1}')`,(err)=>{
                    if(err)throw err;
                    let hiba='';
                    res.render('index',{hiba});
                });
            }
        }
    })
})

app.post('/chat',(req,res)=>{
    let hiba="";
    let username=req.body.nickname;
    let password=req.body.password;
    pool.query(`SELECT * FROM users WHERE username='${username}' AND password='${password}'`,(err,results)=>{
        if(err)throw err;
        if(results.length!=0)
        {
            session.nickname=req.body.nickname;
            session.roomname=req.body.room;
            pool.query(`SELECT * FROM messages WHERE room='${req.body.room}'`,(err,results)=>{
                if(err)throw err;
                res.render('chat',{results});
            })
           // res.render('chat');

        }
        else
        {
            hiba="rossz adatok";
            res.render('index',{hiba});
        }

    });
});
io.on('connection',(socket)=>{
    //console.log('scoket connected...'+socket.id);

    //clinet connected to room
    socket.on('JoinToRoom',()=>{
        const user=joinUser(socket.id,session.nickname,session.roomname);
        //join the room
        socket.join(user.room);

        //update room info
        io.to(user.room).emit('updateRoom',session.roomname,getRoomUsers(session.roomname));
        
        //welcome curent user
        socket.emit('message',fromatmessage('System',`Welcome to ${user.room}!`));

        //broadcast another user
        socket.broadcast.to(user.room).emit('message',fromatmessage('System',`${user.name} joined the room`));
    });

    //Listen for messages
    socket.on('message',(msg)=>{
        const user=getCurentUser(socket.id);
        //broadcastmessage another user
        io.to(user.room).emit('message',fromatmessage(user.name,msg));
        let time=moment().format('H:mm');
        pool.query(`INSERT INTO messages (room,username,time,message) VALUES ('${user.room}','${user.name}','${time}','${msg}')`,(err)=>{
            if(err)throw err;
        });
    });

    //when anybody typing...
    socket.on('typing',(id)=>{
        const user=getCurentUser(id);
        socket.broadcast.to(user.room).emit('typing',`${user.name} is typing...`);
    });

    //user leave the room
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id);
        // broadcast to another users
        io.to(user.room).emit('message',fromatmessage('System',`${user.name} has left the room.`));

        //update room information to another user
        io.to(user.room).emit('updateRoom',user.room,getRoomUsers(user.room));
    })
});
 
server.listen(port,()=>{
    console.log('Server listening: '+port);
})
