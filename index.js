const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mysql = require('mysql');
const md5 = require('md5');
server.listen(3000, () => console.log('server is running'));

app.get('/', (req, res) => console.log('Fun'));
const usersOnline = [];
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'CaroGame'
});
connection.connect((err) => {
    if (err) {
        console.log(err.message);
        return;
    }
    io.on('connection', socket => {
        console.log('Co nguoi ket noi: ' + socket.id);
        socket.on('USER_DANG_KY', info => {
            const { email, name, password } = info;
            const query = `INSERT INTO USERS(email, name, password) VALUES ('${email}', '${name}', '${md5(password)}')`;
            connection.query(query, (err, result, fields) => {
                let ketqua = undefined;
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY')
                        ketqua = 'TRUNG_EMAIL';
                    else
                        ketqua = 'THAT_BAI';
                } else {
                    ketqua = 'THANH_CONG';
                }
                socket.emit('SERVER_SEND_DANG_KY', ketqua);
            });
        });
        socket.on('USER_DANG_NHAP', info => {
            const {email, password} = info;
            const query = `SELECT * FROM USERS WHERE email = '${email}' AND password = '${md5(password)}'`;
            connection.query(query, (err, result, fields) => {
                if (err) {
                    console.log(err);
                } else {
                    const arr = JSON.parse(JSON.stringify(result));
                    if (arr.length === 0) {
                        socket.emit('SERVER_SEND_DANG_NHAP', 'DANG_NHAP_THAT_BAI');
                    } else {
                        socket.emit('SERVER_SEND_DANG_NHAP', 'DANG_NHAP_THANH_CONG');
                    }
                }
            });
        });
    });
});

