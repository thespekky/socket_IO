const http=require('http');
const express=require('express');
var session=require('express-session');
const ejs=require('ejs');
const socketio=require('socket.io');
const {joinUser,getRoomUsers,userLeave,getCurentUser}=require('./utils/users.js');
const {fromatmessage}=require('./utils/messages.js');
const app=express();
const server=http.createServer(app);
const port=3000;
const io=socketio(server);

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:true
}));

app.get('/',(req,res)=>{
    res.render('index');
});

app.post('/chat',(req,res)=>{
    session.nickname=req.body.nickname;
    session.roomname=req.body.room;
   //console.log(nickname,roomname);
    res.render('chat');
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
        socket.broadcast.to(user.room).emit('message',fromatmessage(user.name,msg));
    })

    //user leave the chat
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