const socket = io();

// 각 요소 가져오기
const myFace = document.getElementById("myFace"); // video 태그 요소
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

// 사용자의 장치 목록 받아오기
async function getCameras() {
    try {
        const devices = await navigator
            .mediaDevices
            .enumerateDevices(); // 장치 리스트 가져오기
        const cameras = devices.filter(devices => devices.kind === "videoinput"); // videoinput만 가져오기
        const currentCamera = myStream.getVideoTracks()[0]; // 비디오 트랙의 첫번째 가져오기. 이게 cameras에 있는 label과 같다면 그 label은 선택된 것.
        cameras.forEach(camera => { // 각 카메라 옵션들을 select 요소에 넣음
            const option = document.createElement("option");
            option.value = camera.deviceId; // 카메라 고유 값
            option.innerText = camera.label; // 사용자 선택시 label을 보고 선택하도록 함
            if (currentCamera.label == camera.label) { // stream의 현재 카메라와 selcet 카메라 옵션이 같도록 함
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch (e) {
        console.log(e);
    }
}

// 사용자 카메라 영상 가져오기 (비동기 처리)
async function getMedia(deviceId) {
    const initialConstrains = { // 초기 설정
        audio: true,
        video: {
            facingMode: "user"
        }
    };
    const cameraConstrains = { // 카메라 변경 후 설정
        audio: true,
        video: {
            deviceId: {
                exact: deviceId
            }
        }
    };

    try {
        myStream = await navigator
            .mediaDevices
            .getUserMedia(
                // 캠 장치 연결
                            deviceId
                    ? cameraConstrains
                    : initialConstrains
            );
        myFace.srcObject = myStream; // video 태그 요소에 해당 캠 장치 연결
        if (!deviceId) {
            await getCameras(); // 사용자 비디오 영상 가져온 후 장치 목록 받아옴 (초기 1번만)
        }
    } catch (e) {
        console.log(e);
    }
}

// 카메라 온오프 버튼 이벤트 핸들러
function handleCameraClick() {
    // 카메라 Track enabled를 토글시켜 온오프 제어
    myStream
        .getVideoTracks()
        .forEach(track => track.enabled = !track.enabled);
    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

// 음소거 버튼 이벤트 핸들러
function handleMuteClick() {
    // 오디오 Track enabled를 토글시켜 음소거 제어
    myStream
        .getAudioTracks()
        .forEach(track => track.enabled = !track.enabled);

    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

// 카메라 변경을 위한 select 이벤트 핸들러
async function handleCameraChange() {
    await getMedia(camerasSelect.value); // 다시 getMedia를 호출해 카메라를 선택한 카메라로 재시작 한다.
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack); // 카메라 변경시 상대방에도 변경되도록 replaceTrack()
    }
}

// 음소거, 카메라 버튼, 카메라 선택 이벤트 리스너 연결
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// --------------- Welcome Form (join a room) -----------------------//
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

// 초기 방 입장시 설정
async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection(); // RTC 연결 함수 (비동기 필요)
}

// 초기 방 입장 이벤트 핸들러
async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// ---------------- Socket Code -------------------------------------
// 방을 미리 들어와 있던 사람이 수신 (Peer A)
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer(); // offer을 생성하게 된다.
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName); // 생성한 offer을 우선 서버로 전달 (서버를 거쳐 Peer B로 전달)
});

// 방을 들어가려고 하는 사람이 수신 (Peer B)
socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer(); //answer을 생성
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

// peerA가 다시 answer을 수신 (setRemoteDescription)
socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

// peerA도 Ice 이벤트 수신 (서로 모두 주고 받음)
socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});


// RTC code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        // google이 제공하는 무료 stun server이다. (장치에 공용ip주소를 알려주는 서버)
        // -> 다른 네트워크에 있는 장치들이 서로를 찾을 수 있게 된다.
        iceServers: [
            {
                urls:[
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

// Ice 이벤트 핸들러
function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName); // peerB 브라우저가 peerA로 candidate 전송
}

// addstream 이벤트 핸들러
function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    console.log("Peer's Stream", data.stream);
    peerFace.srcObject = data.stream;
}