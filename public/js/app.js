let socket=io();
let roomname=document.querySelector('#roomname');
let userslist=document.querySelector('#userslist');
let chatMessages=document.querySelector('.chat-messages');
let msgTxt=document.querySelector('#msgTxt');
let sendBtn=document.querySelector('#sendBtn');
let feedbackbox=document.querySelector('#feedback');

//client connected to the server
socket.emit('JoinToRoom');

//update room data
socket.on('updateRoom',(room,users)=>{
    outputRoomName(room);
    outoutUserList(users);
})

//recieve message
socket.on('message',(msg)=>{
    console.log(msg);
    outputMessage(msg);
});

//when user is typing
msgTxt.addEventListener('keypress',()=>{
    socket.emit('typing',socket.id);
});

//listening for typing
socket.on('typing',(msg)=>{
    feedback(msg);
})

sendBtn.addEventListener('click',()=>{
    let msg=msgTxt.value;
    if(msg!='')
    {
        socket.emit('message',msg);
        msgTxt.value='';
        msgTxt.focus();
    }
})

//add roomname to DOM
function outputRoomName(room)
{
    roomname.innerHTML=room;
}
//add users to DOM
function outoutUserList(users)
{
    userslist.innerHTML='';
    users.forEach(user => {
        const li=document.createElement('li');
        li.innerHTML=user.name;
        userslist.appendChild(li);
    });
}

//add message to DOM
function outputMessage(message)
{
    const div=document.createElement('div');
    div.classList.add('message');
    div.classList.add('animate__animated');
    div.classList.add('animate__slideInLeft');
    div.classList.add('animate__faster');
    const p=document.createElement('p');
    p.classList.add('uname');
    p.innerText=message.username;
    p.innerHTML+=`<span>${message.time}</span>`;
    div.appendChild(p);
    const p2=document.createElement('p');
    p2.innerText=message.text;
    div.appendChild(p2);    
    chatMessages.appendChild(div);
}

// add feedback to DOM
function feedback(msg)
{
    feedbackbox.innerHTML=msg;
    setTimeout(clearfeedback,1500);
}
function clearfeedback()
{
    feedbackbox.innerHTML='';
}