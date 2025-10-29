// Detección facial y embeddings
export class FaceDetector {
    constructor() {
        this.modelsLoaded = false;
        this.modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    }

    async loadModels() {
        if (this.modelsLoaded) return true;
        
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(this.modelPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath)
            ]);
            this.modelsLoaded = true;
            return true;
        } catch (err) {
            console.error('Error cargando modelos:', err);
            return false;
        }
    }

    async detectFace(input) {
        if (!this.modelsLoaded) return null;

        const detection = await faceapi
            .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        return detection;
    }

    drawLandmarks(canvas, detection) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!detection) return;

        const landmarks = detection.landmarks.positions;
        
        // Dibujar puntos
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        
        landmarks.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Dibujar líneas conectando puntos
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;

        this.drawFaceContour(ctx, landmarks);
    }

    drawFaceContour(ctx, landmarks) {
        // Contorno facial (puntos 0-16)
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
            const point = landmarks[i];
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();

        // Ojos, nariz, boca (conexiones básicas)
        const connections = [
            [36, 41], [42, 47], // Ojos
            [27, 30], [31, 35], // Nariz
            [48, 59] // Boca
        ];

        connections.forEach(([start, end]) => {
            ctx.beginPath();
            ctx.moveTo(landmarks[start].x, landmarks[start].y);
            for (let i = start; i <= end; i++) {
                ctx.lineTo(landmarks[i].x, landmarks[i].y);
            }
            ctx.stroke();
        });
    }

    compareDescriptors(descriptor1, descriptor2) {
        return faceapi.euclideanDistance(descriptor1, descriptor2);
    }
}