
const socket = io();

const videoGrid = document.getElementById('video-grid');

async function init(socketId) {
    const pc = new RTCPeerConnection({
        sdpSemantics: 'unified-plan',
        iceServers: [{urls: ['stun:127.0.0.1:3478']}],
    });

    pc.onicecandidate = ({ candidate }) => {
        console.log('candidate-offer sent', candidate)
        candidate && socket.emit('candidate-offer', candidate);
    };


    socket.on('candidate-answer', (candidate) => {
        console.log('candidate-answer received', candidate)
        candidate && pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    pc.addEventListener('track', function (evt) {
        console.log('track added', evt)
        videoGrid.innerHTML += `<video playsinline autoplay class="remote-video"></video>`.repeat(evt.streams.length);
        const videos = document.querySelectorAll('.remote-video');
        videos.forEach((video, index) => {
            video.srcObject = evt.streams[index];
            document.onclick = () => video.play()
        });
    });

    pc.addTransceiver('video', {direction: 'recvonly'});


    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);


    socket.emit('offer', socketId, pc.localDescription);

    socket.on('answer', (description) => {
        console.log('answer', description)
        pc.setRemoteDescription(description);
    });
}

socket.on('connect', () => {
    void init(socket.id)
})
