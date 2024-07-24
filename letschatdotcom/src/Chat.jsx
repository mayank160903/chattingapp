import React, { useContext, useEffect, useRef, useState } from 'react'
import Logo from './Logo';
import UserContext from './UserContext';
import { uniqBy } from 'lodash';
import axios from 'axios';
import Friends from './Friends';
import EmojiPicker from 'emoji-picker-react';
import Avatar from './Avatar';
import './custom.css';
import Sidebar from './Sidebar';

const Chat = () => {

    const [ws , setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople , setOfflinePeople] = useState({});
    const [selectedUserId , setSelectedUserId] = useState(null);
    const [selectedUserName , setSelectedUserName] = useState(null);
    const [messages , setMessages] = useState([]);
    const [newMsg , setNewMsg] = useState('');
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const {username , id, setId , setUsername} = useContext(UserContext);
    const divUnderMessages = useRef();
    

    useEffect(() => {
        connectToWS();
    }, []);

    function connectToWS(){
        const ws = new WebSocket('ws://localhost:4000');
        setWs(ws);
        ws.addEventListener('message' , handleMessage );
        ws.addEventListener('close' , () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to Reconnect.');
                connectToWS();
            }, 1000);
        });
    }

    function showOnlinePeople(peopleArray){
        const people = {};
        peopleArray.forEach(({userId , username}) => {
            people[userId] = username;
        })
        setOnlinePeople(people);
    }

    const addEmoji = (event) => {
        setNewMsg(newMsg + event.emoji);
    };

    function handleMessage(ev) {
        const messageData = JSON.parse(ev.data);
        if('online' in messageData){
            showOnlinePeople(messageData.online);
        }
        else if('text' in messageData) {
            if(messageData.sender === selectedUserId){
                setMessages(prev => ([...prev, {...messageData}]))
            }
        }
    }

    function sendMsg(ev, file = null){
        if(ev) ev.preventDefault();
        ws.send(JSON.stringify({
            recipient : selectedUserId,
            text : newMsg,
            file,
        
        }));
        

        if(file) {
            axios.get('/messages/'+ selectedUserId)
            .then(response => {
                setMessages(response.data);
            })
            .catch(error => {
                console.error(error);
            });
        } else {
            setNewMsg('');
            setMessages(prev => ([...prev , {
            text: newMsg , 
            sender : id,
            recipient : selectedUserId,
            _id: Date.now(),
            createdAt: new Date(),
        }]));
        }
    }


    function sendFile(ev) {
        const reader = new FileReader();
        reader.readAsDataURL(ev.target.files[0]);
        reader.onload = () => {
            sendMsg(null, {
                name : ev.target.files[0].name,
                data : reader.result,
            })
        }
    }

    function logoutFunc() {
        axios.post('/logout')
        .then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if(div){
            div.scrollIntoView({behaviour : 'smooth' , block : 'end'});
        }
     } , [messages]);

     useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArray = res.data
            .filter(p => p._id !== id)
            .filter(p => !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople = {};
            offlinePeopleArray.forEach(p => {
                offlinePeople[p._id] = p;
            })
            setOfflinePeople(offlinePeople);
        })
     } , [onlinePeople])


     useEffect(() => {
        if(selectedUserId){
            axios.get('/messages/'+ selectedUserId)
            .then(response => {
                setMessages(response.data);
            })
            .catch(error => {
                console.error(error);
            });

            axios.get(`/user/${selectedUserId}`)
            .then(response => {
                setSelectedUserName(response.data.username);
            })
            .catch(error => {
                console.error(error);
            })
        }
     } , [selectedUserId]);

    const onlinePeopleExec = {...onlinePeople};
    delete onlinePeopleExec[id];

    const messagesUnique = uniqBy(messages , '_id');


    function isValidTimestamp(timestamp) {
        return !isNaN(timestamp) && timestamp > 0;
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isValidTimestamp(timestamp)) {
            const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
            return formattedTime;
        } else {
            return '10:10';
        }
    }
    

  return (
    <div className='flex h-screen'
    style={{ backgroundImage: `url('https://i.pinimg.com/originals/3d/f4/37/3df437922930cf2e2cbbe9f5b22132d3.jpg')` , backgroundPosition: 'center' }} 
    >
    <Sidebar />
      <div className="w-1/4 bg-black bg-opacity-40 flex flex-col font-semibold border-r border-black">
      <div className='flex-grow overflow-y-scroll example'>
      <Logo />
      {Object.keys(onlinePeopleExec).map(userId => (
        <Friends
        key={userId} 
        id={userId} 
        online={true}
        username={onlinePeopleExec[userId]} 
        onClick={() => {setSelectedUserId(userId); setEmojiPickerVisible(false);}}
        selected = {userId === selectedUserId}
        />
      ))}
      {Object.keys(offlinePeople).map(userId => (
        <Friends
        key={userId} 
        id={userId} 
        online={false}
        username={offlinePeople[userId].username} 
        onClick={() => {setSelectedUserId(userId); setEmojiPickerVisible(false);}}
        selected = {userId === selectedUserId}
        />
      ))}
      </div>
      <div  className='p-2 text-center flex items-center justify-center'>
        <span className='mr-2 text-md text-green-400 flex items-center'>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Hello! {username} |</span>
        <button 
        onClick={logoutFunc}
        className='text-md text-white bg-emerald-600 py-1 px-3 rounded-md border'>
            Log Out
            </button>
      </div>
      </div>
      <div 
       
       className="flex flex-col w-3/4 py-5 pl-5 pr-2 bg-black bg-opacity-40">
        {selectedUserId && (
            <div className='flex border-b  border-black opacity-75'>
                <div className="flex p-2 items-center ">
                    <Avatar 
                    userId={selectedUserId}
                    username={selectedUserName ? selectedUserName : "u"}
                    online={true}
                    />
                </div>
                <div className='flex text-white text-xl ml-5 py-4'>
            {selectedUserName}
        </div>
            </div>
            )}
      <div className='flex-grow'>
        {!selectedUserId && (
            <div className='flex flex-grow h-full items-center justify-center'>
                <div className='text-gray-400'>
                    &larr; Select a Chat from your friends
                </div>
            </div>
        )}
        {!!selectedUserId && (
              <div className='relative h-full'>
                <div className='overflow-y-scroll example absolute top-0 left-0 right-0 bottom-2'>
                    {messagesUnique.length === 0 && (
                        <div className='text-center text-white py-20 mt-20'>
                            Start your conversation with {selectedUserName}
                        </div>
                    )}
                {messagesUnique.map(message => (
                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                    <div className={"text-left inline-block p-2 my-2 rounded-lg w-auto " + (message.sender === id ? "bg-green-400 text-black" : " text-gray-300 bg-emerald-800" )}>
                       {message.text}
                       {message.file && (
          <div>
            {/\.(jpg|jpeg|png|gif)$/i.test(message.file) ? (
              <img
                src={axios.defaults.baseURL + '/uploads/' + message.file}
                alt="uploaded file"
                className='max-w-80 h-auto mt-2 pb-2'
              />
            ) : (
              <a target="_blank" className='flex items-center gap-1 border-b' href={axios.defaults.baseURL + '/uploads/' + message.file}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                {message.file}
              </a>
            )}
          </div>
        )}
                <div className="text-xs text-gray-900">{message.createdAt[11] + message.createdAt[12] + ":" + message.createdAt[14] + message.createdAt[15]}</div>
                    </div>
                    </div>
                ))}
                <div ref={divUnderMessages}></div>
            </div>
            </div>

        )}
        </div>
        {!!selectedUserId && (
            <form className='flex border-t pt-2 border-black gap-2 px-4' onSubmit={sendMsg}>
            
            <button type='button' onClick={() => setEmojiPickerVisible(!emojiPickerVisible)} className='rounded-sm p-2'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>

            </button>
            <label type="button" className=' rounded-sm p-2 cursor-pointer text-gray-400'>
                <input type="file" className='hidden' onChange={sendFile} />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>

            </label>
            <input 
            type="text"
            value={newMsg}
            required={true}
            onChange={ev => setNewMsg(ev.target.value)}
            className='bg-black bg-opacity-5 text-white flex-grow border-black rounded-sm p-2' 
            placeholder='Type your message here' />

            <button type='submit' className=' rounded-sm p-2 text-white'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
    
            </button>
          </form>
        )}
        {emojiPickerVisible && (
            <div className="absolute bottom-16 px-4">
                <EmojiPicker
                    
                        onEmojiClick={addEmoji}
                        theme='dark'
                        skinTonesDisabled={false}
                        reactionsDefaultOpen={true}
                    />
            </div>
                    
                )}
      
      </div>
    </div>
  )
}

export default Chat


