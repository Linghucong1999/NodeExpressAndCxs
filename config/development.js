module.exports = {
    port: parseInt(process.env.PORT, 10) || 8001,
    url: 'mongodb://localhost:27017/elm-v3',
    session: {
        name: 'SID',
        secret: 'SID',
        cookie: {
            httpOnly: true,         //浏览器禁止使用JavaScript访问会话cookie，只能通过HTTP协议访问，这有助于防止跨站点脚本攻击（XSS）
            secure: false,
            maxAge: 24 * 60 * 60 * 1000 
        }
    }
};