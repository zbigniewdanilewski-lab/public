
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let users = []; // przykładowe użytkownicy w pamięci (do testów)
let sessions = {}; // tokeny sesji

// REJESTRACJA
app.post('/register', async (req, res) => {
const { nick, email, password } = req.body;
if(!nick || !email || !password) return res.json({success:false,message:'Wypełnij wszystkie pola'});
const exists = users.find(u=>u.email===email);
if(exists) return res.json({success:false,message:'Email już istnieje'});
const token = Date.now().toString(36);
users.push({nick,email,password,confirmed:false,token});

// Wyślij maila potwierdzającego
let transporter = nodemailer.createTransport({
host: "smtp.mailtrap.io", // zmień na EmailJS lub własny SMTP
port: 587,
auth: {
user: "XXXX",
pass: "XXXX"
}
});
let info = await transporter.sendMail({
from: '"Warsztat" <zbigniew.danilewski@gmail.com>',
to: email,
subject: "Potwierdzenie rejestracji",
html: `<p>Kliknij w link, aby potwierdzić: <a href="http://localhost:${PORT}/confirm/${token}">Potwierdź</a></p>`
});
res.json({success:true,message:'Sprawdź maila aby potwierdzić rejestrację'});
});

// POTWIERDZENIE MAILA
app.get('/confirm/:token', (req,res)=>{
const user = users.find(u=>u.token===req.params.token);
if(user){
user.confirmed = true;
return res.send('Email potwierdzony! Możesz teraz się zalogować.');
}
res.send('Nieprawidłowy token');
});

// LOGOWANIE
app.post('/login',(req,res)=>{
const { email, password } = req.body;
const user = users.find(u=>u.email===email && u.password===password && u.confirmed);
if(!user) return res.json({success:false,message:'Błędny email/hasło lub konto niepotwierdzone'});
const sessionToken = Date.now().toString(36);
sessions[sessionToken] = user.nick;
res.json({success:true, sessionToken, nick:user.nick});
});

// SPRAWDZANIE SESJI
app.get('/session/:token',(req,res)=>{
const nick = sessions[req.params.token];
if(!nick) return res.json({valid:false});
res.json({valid:true,nick});
});

app.listen(PORT,()=>console.log(`Serwer działa na http://localhost:${PORT}`));
