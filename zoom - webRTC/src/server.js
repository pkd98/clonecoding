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
const wsServer = SocketIO(httpServer);

const handleListen = () => console.log('Listening on http://localhost:3000');
httpServer.listen(3000, handleListen);