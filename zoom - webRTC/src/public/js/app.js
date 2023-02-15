const socket = io(); // socket io 이용 백엔드 서버와 연결
// 각 요소 가져오기
const myFace = document.getElementById("myFace"); // video 태그 요소
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;


// 사용자의 장치 목록 받아오기
async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices(); // 장치 리스트 가져오기
        const cameras = devices.filter(devices => devices.kind === "videoinput"); // videoinput만 가져오기
        const currentCamera = myStream.getVideoTracks()[0]; // 비디오 트랙의 첫번째 가져오기. 이게 cameras에 있는 label과 같다면 그 label은 선택된 것.
        cameras.forEach(camera => { // 각 카메라 옵션들을 select 요소에 넣음
            const option = document.createElement("option");
            option.value = camera.deviceId; // 카메라 고유 값
            option.innerText = camera.label; // 사용자 선택시 label을 보고 선택하도록 함
            if(currentCamera.label == camera.label){ // stream의 현재 카메라와 selcet 카메라 옵션이 같도록 함
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch (e) {
        console.log(e);
    }
}

// 사용자 카메라 영상 가져오기 (비동기 처리)
async function getMedia(deviceId){
    const initialConstrains = { // 초기 설정
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstrains = { // 카메라 변경 후 설정
        audio:true,
        video: {deviceId: { exact: deviceId }, },
    };

    try{
        myStream = await navigator.mediaDevices.getUserMedia( // 캠 장치 연결
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream; // video 태그 요소에 해당 캠 장치 연결
        if(!deviceId){
            await getCameras(); // 사용자 비디오 영상 가져온 후 장치 목록 받아옴 (초기 1번만)
        }
    } catch(e){
        console.log(e);
    }
}


// 카메라 온오프 버튼 이벤트 핸들러
function handleCameraClick() {
    // 카메라 Track enabled를 토글시켜 온오프 제어
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(cameraOff){
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
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);

    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

// 카메라 영상 가져오기
getMedia();

// 카메라 변경을 위한 select 이벤트 핸들러
async function handleCameraChange() {
    await getMedia(camerasSelect.value); // 다시 getMedia를 호출해 카메라를 선택한 카메라로 재시작 한다.
}

// 음소거, 카메라 버튼, 카메라 선택 이벤트 리스너 연결
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);