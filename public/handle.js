$(document).ready(() => {
    let userEmail, userName = undefined;
    const socket = io('http://localhost:3000');

    socket.on('SERVER_SEND_DANG_KY', data => alert(data));
    socket.on('SERVER_SEND_DANG_NHAP_THAT_BAI', data => alert(data));
    socket.on('SERVER_SEND_DANG_NHAP_THANH_CONG', data => console.log(data));
    socket.on('SERVER_SEND_USER_INFO', data => console.log(data));
    socket.on('SERVER_SEND_USER_DANG_XUAT', data => console.log(data));

    $('#btnDangNhap').click(() => {
        const email = $('#edtEmail').val();
        const password = $('#edtPassword').val();
        if (email !== '' && password !== '') {
            userEmail = email;
            userName = name;
            socket.emit('USER_DANG_NHAP', { email, password });
        }
    });

    $('#btnDangXuat').click(() => {
        socket.emit('USER_DANG_XUAT');
    });

    $('#btnDangKy').click(() => {
        const email = $('#edtEmail').val();
        const password = $('#edtPassword').val();
        const name = $('#edtName').val();
        if (email !== '' && name !== '' && password !== '')
            socket.emit('USER_DANG_KY', { email, name, password })
        else {
            alert('Vui long nhap thong tin day du');
        }
    });
});