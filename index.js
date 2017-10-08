const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mysql = require('mysql');
const md5 = require('md5');
server.listen(3000, () => console.log('server is running'));

function disconnect(name, email, socket, connection) {
    // Update is_sign_in của user về 0.
    const query = `UPDATE USERS SET is_sign_in = 0 WHERE email = '${email}'`;
    connection.query(query, (err, result, fields) => {
        if (err) {
            console.log(err.message);
            return;
        }
    });
    // Gửi name và email cho tất cả các user còn lại.
    socket.broadcast.emit('SERVER_SEND_USER_DANG_XUAT', { name, email });
}

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
            const { email, password } = info;
            const query = `SELECT * FROM USERS WHERE email = '${email}' AND password = '${md5(password)}' AND is_sign_in = 0`;
            connection.query(query, (err, result, fields) => {
                if (err) {
                    console.log(err);
                } else {
                    const arr = JSON.parse(JSON.stringify(result));
                    if (arr.length === 0) {
                        socket.emit('SERVER_SEND_DANG_NHAP_THAT_BAI', 'DANG_NHAP_THAT_BAI');
                    } else {
                        const { name } = arr[0];
                        // Gán email và name vào cho socket
                        socket.email = email;
                        socket.name = name;

                        // Nếu đăng nhập thành công. Update 'is_sign_in = 1'.                     
                        const queryUpdate = `UPDATE USERS SET is_sign_in = 1 WHERE email = '${email}'`;
                        connection.query(queryUpdate, (err, result, fields) => {
                            if (err) {
                                console.log(err.message);
                                return;
                            }
                        });

                        // Lấy tất cả các user có 'is_sign_in = 1, gửi cho user vừa đăng nhập, kèm theo name và email'.
                        const queryArr = `SELECT email, name FROM USERS WHERE is_sign_in = 1`;
                        connection.query(queryArr, (err, result, fields) => {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            users = JSON.parse(JSON.stringify(result));
                            socket.emit('SERVER_SEND_DANG_NHAP_THANH_CONG', { email, name, users });
                        });

                        // Gửi email và name của user mới đăng nhập cho các người còn lại
                        socket.broadcast.emit('SERVER_SEND_USER_INFO', { email, name });
                    }
                }
            });
        });

        socket.on('USER_DANG_XUAT', (info) => {
            const { name, email } = info;
            socket.name = undefined;
            socket.email = undefined;
            disconnect(name, email, socket, connection);
        });

        socket.on('disconnect', () => {
            const { name, email } = socket;
            if (name === undefined && email === undefined)
                return;
            disconnect(name, email, socket, connection);
        });
    });
});
