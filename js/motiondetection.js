// Detección de movimiento
export class MotionDetector {
    constructor(videoElement, threshold = 30, minPixels = 2000) {
        this.video = videoElement;
        this.threshold = threshold;
        this.minPixels = minPixels;
        this.lastFrame = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    detect() {
        if (!this.video.videoWidth) return false;

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);

        const currentFrame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (!this.lastFrame) {
            this.lastFrame = currentFrame;
            return false;
        }

        const diff = this.calculateDifference(currentFrame, this.lastFrame);
        this.lastFrame = currentFrame;

        return diff > this.minPixels;
    }

    calculateDifference(frame1, frame2) {
        const data1 = frame1.data;
        const data2 = frame2.data;
        let diffPixels = 0;

        for (let i = 0; i < data1.length; i += 4) {
            const diff = Math.abs(data1[i] - data2[i]) +
                        Math.abs(data1[i + 1] - data2[i + 1]) +
                        Math.abs(data1[i + 2] - data2[i + 2]);

            if (diff > this.threshold) diffPixels++;
        }

        return diffPixels;
    }

    reset() {
        this.lastFrame = null;
    }
}