const express = require('express')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs');
const ws = require('ws');
const fs = require('fs');
const multer = require('multer');

dotenv.config();

const upload = multer({dest : 'uploads/'})

mongoose.connect(process.env.MONGO_URL);

const jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use('/uploads' , express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}))

async function getUserDataFromRequest(req) {

    return new Promise((resolve , reject) => {
        const token = req.cookies?.token;
        if(token){
            jwt.verify(token, jwtSecret , {} , (err , userData) => {
            if(err) return reject(err);
            resolve(userData);
            }) 
        } else{
            reject('no token');
        }
    })
    
}

app.get('/test' , (req, res) => {
    res.json('test ok');
})


app.get('/messages/:userId' , async (req, res) => {
    try{
        const {userId} = req.params;
        const userData = await getUserDataFromRequest(req);
        const ourUserId = userData.userId;
        const messages = await Message.find({
        sender: {$in: [userId , ourUserId]},
        recipient: {$in : [userId , ourUserId]},
        }).sort({createdAt: 1}).exec();
        res.json(messages);
    } catch(err) {
        res.status(401).json({message : err});
    }
});

app.get('/people' , async (req, res) => {
    const users = await User.find({}, {'_id': 1, username : 1});
    res.json(users);
})


app.get('/profile', async (req, res) => {
    try {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                res.json(userData);
            });
        } else {
            res.status(401).json('no token');
        }
    } catch (err) {
        res.status(401).json('no token');
    }
});

app.get('/user/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select('username imagePath');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const foundUser = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });        
        if (!foundUser) {
            return res.status(401).json('User Not Found');
            
        }
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                    id: foundUser._id,
                });
            });
        } else {
            res.status(401).json('Invalid password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json('Internal Server Error');
    }
});



app.post('/logout' , (req, res) => {
    res.cookie('token' , '' , {sameSite: 'none' , secure: true}).json('ok');
})

app.post('/register' , upload.single('image') ,async (req, res) => {
    const {username , password} = req.body;
    const file = req.file; // access uploaded file
    let imagePath = null;
    if (file) {
        imagePath = file.path; // save file path
    }
    try{

        const hashed = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username, 
            password : hashed,
            imagePath,
        });
        jwt.sign({userId : createdUser._id, username}, jwtSecret , {} ,(err , token) =>{
            if(err) throw err;
            res.cookie('token' , token, {sameSite:'none', secure: true}).status(201).json({
                id : createdUser._id,
                username
            });
        })
    } catch(err){
        if(err) throw err;
        res.status(500).json('error')
    }
});


const server = app.listen(4000);

const wss = new ws.WebSocketServer({server});

wss.on('connection' , (connection , req) => {

    function notifyAboutOthers(){
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify(
                {
                    online : [...wss.clients].map(c => ({userId: c.userId , username : c.username}))
                }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOthers();
            
        } , 1000);
    } , 4000);

    connection.on('pong' , () => {
        clearTimeout(connection.deathTimer);
    })

    //read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if(cookies){
        const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
        if(tokenCookieString){
            const token = tokenCookieString.split('=')[1];
            if(token){
                jwt.verify(token , jwtSecret , {} , (err , userData) => {
                    if(err) throw err;
                    const {userId , username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;
        if (file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.' + ext;
            const path = __dirname + '/uploads/' + filename;
            const base64Data = file.data.split(',')[1];
            const bufferData = new Buffer.from(base64Data, 'base64');
            fs.writeFile(path, bufferData, () => {});
        }
        
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });
    
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender: connection.userId,
                    recipient,
                    file: file ? filename : null,
                    _id: messageDoc._id,
                    createdAt: messageDoc.createdAt,
                })));

                console.log(messageDoc);
        }
        console.log(messageData);

        
    });
    
 

    //notify everyone about online people (when someone connects)
    notifyAboutOthers();
    
});
