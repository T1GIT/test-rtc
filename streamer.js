const { VideoFrame, VideoTrack } = require('@roamhq/wrtc');
const {createReadStream} = require("node:fs");

const FRAME_WIDTH = 1920; // Замените на реальную ширину вашего видео
const FRAME_HEIGHT = 1080; // Замените на реальную высоту вашего видео
const FPS = 20; // Замените на реальную частоту кадров вашего видео

const FRAME_SIZE = FRAME_WIDTH * FRAME_HEIGHT * 4; // Предполагаем несжатый RGB

function createMediaStreamFromLocalVideo(videoPath) {
    return new Promise((resolve, reject) => {
        const videoStream = createReadStream(videoPath);
        const frames = [];

        videoStream.on('data', (chunk) => frames.push(chunk));

        videoStream.on('end', () => {
            const buffer = Buffer.concat(frames);
            const videoTrack = new VideoTrack({ kind: 'video' });

            let offset = 0;

            const sendFrames = () => {
                if (offset >= buffer.length) return;

                const frameData = buffer.slice(offset, offset + FRAME_SIZE);
                if(frameData.length !== FRAME_SIZE) {
                    offset += frameData.length;
                    return setTimeout(sendFrames, 1000/FPS);
                }

                const frame = new VideoFrame({
                    data: frameData,
                    width: FRAME_WIDTH,
                    height: FRAME_HEIGHT,
                    timestamp: Date.now(),
                });
                videoTrack.onFrame(frame);
                offset += FRAME_SIZE;

                setTimeout(sendFrames, 1000 / FPS);
            };

            sendFrames();

            const mediaStream = new MediaStream();
            mediaStream.addTrack(videoTrack);
            resolve(mediaStream);
        });

        videoStream.on('error', (err) => reject(err));
    });
}
