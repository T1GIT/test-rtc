
const socket = io();

let streams = []

const videoGrid = document.getElementById('video-grid');


async function init(socketId) {
    streams = await Promise.all([
        navigator.mediaDevices.getDisplayMedia({video: { mediaSource: "screen" }}),
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
    ])
    console.log(socketId)
    socket.emit('server-connection', socketId)

    videoGrid.innerHTML += `<video playsinline autoplay class="remote-video"></video>`.repeat(streams.length);
    const videos = document.querySelectorAll('.remote-video');
    videos.forEach((video, index) => {
        video.srcObject = streams[index];
    });
}

socket.on('connect', () => {
    void init(socket.id)
})


async function connect(socketId, description) {
   const pc = new RTCPeerConnection({
       sdpSemantics: 'unified-plan',
       iceServers: [{urls: ['stun:192.168.0.12:3478']}]
   });

    pc.onicecandidate = ({ candidate }) => {
        console.log('candidate-answer sent', candidate)
        candidate && socket.emit('candidate-answer', socketId, candidate);
    };

    socket.on('candidate-offer', (candidate) => {
        console.log('candidate-offer received', candidate)
        candidate && pc.addIceCandidate(new RTCIceCandidate(candidate));
    });


    await pc.setRemoteDescription(description);
    const combinedStream = new MediaStream();
    streams.forEach(stream => {
        stream.getTracks().forEach(track => {
            combinedStream.addTrack(track);
        });
    })

    pc.addTransceiver('video', {direction: 'sendonly'});
    pc.addTransceiver('video', {direction: 'sendonly'});



    pc.addTrack(streams[0].getTracks()[0], streams[0]);
    pc.addTrack(streams[1].getTracks()[0], streams[1]);

    // combinedStream.getTracks().forEach((track, index) => {
    //     pc.addTrack(track, streams[index]);
    // })

    console.log(combinedStream.getTracks())

    // pc.addTransceiver('video', {direction: 'sendonly'});

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);


    socket.emit('answer', socketId, pc.localDescription);

}

socket.on('offer', (socketId, description) => {
    void connect(socketId, description);
});
