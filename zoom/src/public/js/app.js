const socket = io(); // socket io 이용 백엔드 서버와 연결

// html(pug) 요소
const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");
const msgForm = room.querySelector("#msg");
const nameForm = room.querySelector("#name");

// 처음 msgForm만 hidden 설정. 초기 방 입장, 닉네임 이벤트 리스너 설정
msgForm.hidden = true;
let roomName;
nameForm.addEventListener("submit", handleNicknameSubmit);

// 방 접속 시 welcome hidden 후 해당 room 보이기, 방 이름, 메시지 이벤트 리스너 설정
function showRoom() {
    welcome.hidden = true;
    msgForm.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    msgForm.addEventListener("submit", handleMessageSubmit);
}

// 알림, 새로운 메시지 반영을 위한 함수
function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

// 처음 채팅방 접속을 위한 함수
function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    // socket io는 Object 전송 가능, 첫 번째는 이벤트명, 두 번째는 front-end에서 전송하는 object(보내고 싶은 payload), 세 번째는 서버에서 호출하는 function
    socket.emit("enter_room", input.value, showRoom); // 백엔드 서버로의 에밋
    roomName = input.value; // 방 이름 셋팅
    input.value = ""
}

// 나의 메시지 전송 이벤트 처리 함수
function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

// 닉네임 이벤트 처리 함수
function handleNicknameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    const value = input.value;
    socket.emit("nickname", input.value, roomName, () => {
        addMessage(`Your nickname changed to ${value}`);
    });
}

// 처음 채팅방 접속 이벤트 실행
form.addEventListener("submit", handleRoomSubmit);

// 채팅방 처음 입장 이벤트 발생시 해당 방 전체 인원에게 알림 전송
socket.on("welcome", (user) => {
    addMessage(`${user} joined!`);
})

// 누군가 채팅방 퇴장 이벤트 발생시 해당 방 전체 인원에게 알림 전송
socket.on("bye", (left) => {
    addMessage(`${left} left ㅠㅠ`);
})

// 다른 사람의 새로운 메시지 채팅창 반영
socket.on("new_message", addMessage);

// 타인의 닉네임 변경 알림 채팅창 반영
socket.on("nickname", addMessage);


/* 기존 websocket 이용 채팅 구현
// home.pug내의 ul, form들을 받아옴
const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");

//해당 서버로의 연결 socket으로 frontend에서 backend로 메시지를 보낼 수 있다.
const socket = new WebSocket(`ws://${window.location.host}`); //window.location.host를 통해 서버의 주소를 알 수 있다.

// JSON을 String 형태로 바꿔주는 함수
function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);
}

socket.addEventListener("open", () => { //연결이 됐을 때
    console.log("Connected to Server!");
});

socket.addEventListener("message", (message) => { // 메시지를 받을 때
    // console.log("New message: ", message.data);
    const li = document.createElement("li"); // 새로운 li 요소 생성
    li.innerText = message.data; // 메시지 데이터를 저장
    messageList.append(li); // html ul 요소 내 해당 데이터 넣어 출력 구현
});

socket.addEventListener("close", () => { // 연결이 끊어질 때
    console.log("Disnconnectied from Server!");
});

// setTimeout(() => {
//     socket.send("hello from the browser!");
// }, 10000);

function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    input.value = ''; // 전송하고 나면 input box내 값을 지워줌
}

function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);
*/