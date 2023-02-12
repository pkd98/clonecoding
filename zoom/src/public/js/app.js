const socket = io(); // socket io 이용 백엔드 서버와 연결

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function backendDone(msg) {
    console.log(`The backend says: `, msg);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    // socket io는 Object 전송 가능
    // 첫 번째는 이벤트명, 두 번째는 front-end에서 전송하는 object(보내고 싶은 payload), 세 번째는 서버에서 호출하는 function
    socket.emit(
        "enter_room", // 이벤트 명
        {payload: input.value},
        backendDone // 백엔드에게 끝났다는 사실을 알리기 위한 fuction
    );
    input.value = ""
}

form.addEventListener("submit", handleRoomSubmit);


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