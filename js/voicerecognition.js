// Reconocimiento de voz
export class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Reconocimiento de voz no soportado');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'es-ES';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
    }

    async askForName() {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                console.error('[VOICE] Reconocimiento no disponible');
                reject('Reconocimiento no disponible');
                return;
            }

            console.log('[VOICE] Iniciando escucha...');
            this.isListening = true;

            this.recognition.onresult = (event) => {
                console.log('[VOICE] Resultado recibido:', event.results);
                const name = event.results[0][0].transcript;
                console.log('[VOICE] Nombre capturado:', name);
                this.isListening = false;
                resolve(this.cleanName(name));
            };

            this.recognition.onerror = (event) => {
                console.error('[VOICE] Error:', event.error);
                this.isListening = false;
                reject(event.error);
            };

            this.recognition.onend = () => {
                console.log('[VOICE] Reconocimiento finalizado');
                this.isListening = false;
            };

            try {
                console.log('[VOICE] Llamando a start()...');
                this.recognition.start();
                console.log('[VOICE] Start() ejecutado');
            } catch (err) {
                console.error('[VOICE] Error en start():', err);
                reject(err);
            }
        });
    }

    cleanName(name) {
        // Capitalizar primera letra de cada palabra
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .trim();
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }
}
