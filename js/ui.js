// Gestión de interfaz y animaciones
export class UI {
    constructor() {
        this.screens = {
            idle: document.getElementById('idle-screen'),
            scan: document.getElementById('scan-screen'),
            greet: document.getElementById('greet-screen'),
            name: document.getElementById('name-screen')
        };
        this.currentScreen = 'idle';
    }

    showScreen(screenName) {
        Object.keys(this.screens).forEach(key => {
            this.screens[key].classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        this.currentScreen = screenName;
    }

    updateScanInfo(data) {
        document.getElementById('status').textContent = data.status || 'ANALIZANDO';
        document.getElementById('points').textContent = data.points || '0';
        document.getElementById('confidence').textContent = (data.confidence || 0) + '%';
        document.getElementById('time').textContent = (data.time || 0) + 's';
    }

    showMatchResult(person, distance) {
        const resultDiv = document.getElementById('match-result');
        
        if (person && person.name) {
            resultDiv.innerHTML = `
                <div style="color:#00ff88;font-size:1.3rem;margin-bottom:10px">✓ IDENTIFICADO</div>
                <div style="font-size:1.5rem;font-weight:bold">${person.name.toUpperCase()}</div>
                <div style="margin-top:10px;font-size:0.9rem;opacity:0.7">Confianza: ${Math.round((1 - distance) * 100)}%</div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="color:#ffa500">⚠ DESCONOCIDO</div>
                <div style="font-size:0.9rem;margin-top:10px">Recopilando datos...</div>
            `;
        }
    }

    showNoMatch() {
        const resultDiv = document.getElementById('match-result');
        resultDiv.innerHTML = `
            <div style="color:#ff6b00">✗ NO IDENTIFICADO</div>
            <div style="font-size:0.9rem;margin-top:10px">Persona nueva detectada</div>
        `;
    }

    showGreeting(name) {
        const greetMsg = document.getElementById('greet-msg');
        greetMsg.textContent = `¡Hola ${name}!`;
        this.showScreen('greet');
        
        setTimeout(() => {
            this.showScreen('idle');
        }, 3000);
    }

    showNameRequest() {
        this.showScreen('name');
    }

    updateVoiceStatus(text) {
        document.getElementById('voice-status').textContent = text;
    }

    async animateSearch(duration = 2000) {
        const resultDiv = document.getElementById('match-result');
        let dots = 0;
        
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            resultDiv.innerHTML = `
                <div style="color:#00f0ff">BUSCANDO${'.'.repeat(dots)}</div>
            `;
        }, 300);

        await new Promise(resolve => setTimeout(resolve, duration));
        clearInterval(interval);
    }

    showError(message) {
        alert('Error: ' + message);
    }

    setCanvasSize(canvas, video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
}