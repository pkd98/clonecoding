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