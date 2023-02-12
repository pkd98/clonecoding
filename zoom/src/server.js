import http from "http"; // 기본 설치된 라이브러리
import express from "express"; //npm i express 설치 후 import
import SocketIO from "socket.io";
// import WebSocket from "ws";

const app = express(); // app이라는 변수에 express를 가져와 생성

app.set("view engine", "pug"); // 뷰 엔진 pug 사용
app.set("views", __dirname + "/views"); // pug의 디렉토리 경로 설정
app.use("/public", express.static(__dirname + "/public")); // public 폴더 유저에게 공개
// 라우트 핸들러
app.get("/", (req, res) =>res.render("home")); // 홈페이지로 이동할 때 사용될 템플릿 렌더링
app.get("/*", (req,res) => res.redirect("/")); // 홈페이지 내 어드 페이지에 접근해도 홈으로 연결되도록 리다이렉트


// http 서버 위에 webSocket서버를 생성
//http로 만든 server는 필수 X - 이렇게 하면 http / ws 서버 모두 같은 3000번 포트를 이용해서 돌릴 수 있다.
const httpServer = http.createServer(app);// app은 requestlistener 경로 - express application으로부터 서버 생성
const wsServer = SocketIO(httpServer)

wsServer.on("connection", (socket) =>{ //socket io 이용한 연결
    socket.on("enter_room", (roomName, done) => {
        console.log(roomName);
        setTimeout(()=>{
            done("hello from the backend");
        }, 10000);
    });
});

const handleListen = () => console.log('Listening on http://localhost:3000');
httpServer.listen(3000, handleListen);


/* // 기존 websocket으로 채팅 구현 주석 -> socket io 활용
const wss = new WebSocket.Server({server})
const sockets = []; // 클라이언트의 소켓 연결을 저장

wss.on("connection", (socket) => { // 위 함수를 익명함수로 표현
    sockets.push(socket); // sockets배열에 해당 연결을 저장
    socket["nickname"] = "Anonymous" // 닉네임 익명 초기화

    console.log("Connected to Brower!");
    socket.on("close", () => console.log("Disconnected to Server!"));
    socket.on("message", (msg) => {
        const message = JSON.parse(msg); // string을 JSON으로
        switch(message.type){
            case "new_message":
                sockets.forEach((a) => a.send(`${socket.nickname}: ${message.payload}`));
            case "nickname":
                socket["nickname"] = message.payload;
                }
        // const utf8message = message.toString("utf8"); // 버퍼 형태로 전달된 메시지를 utf8로 변경
        // sockets.forEach(a => a.send(utf8message));// 받아온 메시지를 다시 클라이언트로 전송한다.
    });
});
*/
