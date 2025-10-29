// Orquestador principal
import { Camera } from './camera.js';
import { MotionDetector } from './motiondetection.js';
import { FaceDetector } from './facedetection.js';
import { Database } from './database.js';
import { VoiceRecognition } from './voicerecognition.js';
import { UI } from './ui.js';

class FacialRecognitionApp {
    constructor() {
        this.camera = new Camera(document.getElementById('video'));
        this.motionDetector = new MotionDetector(document.getElementById('video'));
        this.faceDetector = new FaceDetector();
        this.database = new Database();
        this.voice = new VoiceRecognition();
        this.ui = new UI();
        
        this.canvas = document.getElementById('overlay');
        this.isProcessing = false;
        this.scanStartTime = 0;
        this.currentPerson = null;
        this.lastDetectionTime = 0;
        this.cooldownPeriod = 3000;
    }

    async init() {
        console.log('Inicializando sistema...');
        
        this.ui.showScreen('idle');
        const modelsLoaded = await this.faceDetector.loadModels();
        
        if (!modelsLoaded) {
            this.ui.showError('Error cargando modelos de IA');
            return;
        }

        const cameraStarted = await this.camera.start();
        
        if (!cameraStarted) {
            this.ui.showError('No se pudo acceder a la cámara');
            return;
        }

        console.log('Sistema listo');
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => {
            if (!this.isProcessing && this.camera.isReady()) {
                const now = Date.now();
                const timeSinceLastDetection = now - this.lastDetectionTime;
                
                if (timeSinceLastDetection < this.cooldownPeriod) {
                    return;
                }
                
                const motionDetected = this.motionDetector.detect();
                
                if (motionDetected) {
                    console.log('Movimiento detectado');
                    this.handleMotion();
                }
            }
        }, 500);
    }

    async handleMotion() {
        console.log('=== INICIANDO HANDLEMOTION ===');
        this.isProcessing = true;
        this.scanStartTime = Date.now();
        console.log('isProcessing cambiado a true');
        
        console.log('Cambiando a pantalla scan...');
        this.ui.showScreen('scan');
        console.log('Pantalla cambiada');
        this.ui.setCanvasSize(this.canvas, this.camera.video);
        
        this.ui.animateSearch(1500);
        
        console.log('Iniciando detección de cara...');
        const detection = await this.faceDetector.detectFace(this.camera.video);
        console.log('Detección completada:', detection ? 'CARA ENCONTRADA' : 'SIN CARA');
        
        if (detection) {
            console.log('Llamando a processFace...');
            await this.processFace(detection);
        } else {
            console.log('No se detectó cara');
            this.ui.showNoMatch();
            setTimeout(() => {
                this.resetToIdle();
            }, 3000);
        }
    }

    async processFace(detection) {
        console.log('=== ENTRANDO A PROCESSFACE ===');
        console.log('Detection válido:', !!detection);
        const descriptor = Array.from(detection.descriptor);
        console.log('Descriptor extraído:', descriptor.length, 'números');
        const landmarks = detection.landmarks.positions.length;
        const elapsedTime = ((Date.now() - this.scanStartTime) / 1000).toFixed(1);
        
        this.ui.updateScanInfo({
            status: 'PROCESANDO',
            points: landmarks,
            confidence: 85,
            time: elapsedTime
        });

        this.faceDetector.drawLandmarks(this.canvas, detection);

        console.log('Buscando en BD...');
        const match = this.database.findMatch(descriptor);
        console.log('Match encontrado:', match ? 'SÍ (persona: ' + (match.person.name || match.person.id) + ')' : 'NO');
        
        if (match && match.person.name) {
            console.log('Persona conocida con nombre');
            await this.greetPerson(match.person, match.distance);
        } else if (match && !match.person.name) {
            console.log('Persona reconocida sin nombre');
            this.currentPerson = match.person;
            
            if (this.database.hasEnoughSamples(match.person)) {
                console.log('Suficientes muestras, pidiendo nombre');
                await this.requestName(match.person);
            } else {
                console.log('Insuficientes muestras:', match.person.descriptors.length, 'de', this.database.minSamples);
                this.ui.showMatchResult(null, 0);
                setTimeout(() => this.resetToIdle(), 3000);
            }
        } else {
            console.log('Persona nueva, añadiendo a BD');
            const newPerson = this.database.addDescriptor(descriptor);
            this.ui.showNoMatch();
            console.log('Nueva persona detectada:', newPerson.id);
            setTimeout(() => this.resetToIdle(), 3000);
        }
    }

    async greetPerson(person, distance) {
        this.ui.updateScanInfo({
            status: 'IDENTIFICADO',
            points: 68,
            confidence: Math.round((1 - distance) * 100),
            time: ((Date.now() - this.scanStartTime) / 1000).toFixed(1)
        });

        this.ui.showMatchResult(person, distance);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.voice.speak(`¡Hola ${person.name}! Bienvenido`);
        this.ui.showGreeting(person.name);
        
        setTimeout(() => this.resetToIdle(), 3000);
    }

    async requestName(person) {
        this.ui.showNameRequest();
        this.ui.updateVoiceStatus('🎤 Escuchando tu nombre...');
        
        try {
            const name = await this.voice.askForName();
            
            if (name) {
                this.database.assignName(person.id, name);
                this.ui.updateVoiceStatus(`✓ ¡Encantado de conocerte, ${name}!`);
                this.voice.speak(`¡Encantado de conocerte, ${name}!`);
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                this.resetToIdle();
            }
        } catch (err) {
            console.error('Error capturando nombre:', err);
            this.ui.updateVoiceStatus('❌ No te escuché bien. Inténtalo de nuevo más tarde.');
            setTimeout(() => this.resetToIdle(), 3000);
        }
    }

    resetToIdle() {
        console.log('Reseteando a idle...');
        this.isProcessing = false;
        this.currentPerson = null;
        this.motionDetector.reset();
        this.lastDetectionTime = Date.now();
        
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ui.showScreen('idle');
        console.log('Sistema en espera, cooldown activo por', this.cooldownPeriod / 1000, 'segundos');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new FacialRecognitionApp();
    app.init();
});
