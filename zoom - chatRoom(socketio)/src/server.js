import http from "http"; // 기본 설치된 라이브러리
import express from "express"; //npm i express 설치 후 import
import SocketIO from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io"
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
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false
});



// 클라이언트가 개설한 publicRooms을 추출
function publicRooms(){
    const sids = wsServer.sockets.adapter.sids; // 어댑터에 저장된 sids
    const rooms = wsServer.sockets.adapter.rooms; // 어댑터에 저장된 rooms
    const publicRooms = [];
    rooms.forEach((_, key) => { // rooms Map에 저장된 키 값을 sids에 넣어 비교. 같으면 publicRoom 이다.
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

// 방에 참가중인 사람 수 세기
function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


wsServer.on("connection", (socket) =>{ //socket io 이용한 연결
    socket["nickname"] = "Anonymous"; // 닉네임 초기 설정
    wsServer.sockets.emit("room_change", publicRooms()); // 모든 클라이언트 소켓에 새로운 방 공지
    socket.onAny((event) => { // socket에 발생한 이벤트를 출력할 수 있다.
        console.log(`Socket Event:${event}`);
        console.log
    });
    socket.on("enter_room", (roomName, done) => { // 방 이름과 프론트로부터 받은 함수 트리거 (방이동 구현을 위함.)
        socket.join(roomName); // 방 접속
        done(countRoom(roomName));
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // 해당 방의 모든 사람들에게 알림 보내기
        wsServer.sockets.emit("room_change", publicRooms()); // 모든 클라이언트 소켓에 새로운 방 공지
    });
    socket.on("disconnecting", () =>{ // 클라이언트가 연결이 끊어질 때, 해당 방의 모든 사람들에게 알림 보내기
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
    });
    socket.on("disconnect", () =>{ // 클라이언트 연결이 완전히 끊어짐
        wsServer.sockets.emit("room_change", publicRooms()); // 모든 클라이언트 소켓에 방 삭제 공지
    });

    socket.on("new_message", (msg, room, done) => { // 클라이언트의 새로운 메시지 반영하기
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname, room, done) => { // 클라이언트 닉네임 설정
        let beforNickname = socket.nickname; // 이전 닉네임
        socket["nickname"] = nickname; // 새 닉네임 설정
        socket.to(room).emit("nickname", `${beforNickname} changed to ${nickname}`); // 닉네임 변경 공지
        done();
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