// Gestión de base de datos (LocalStorage)
export class Database {
    constructor() {
        this.storageKey = 'faceRecognitionDB';
        this.threshold = 0.6; // Umbral de distancia para matching
        this.minSamples = 5; // Mínimo de muestras para activar saludo
    }

    // Obtener todas las personas
    getAll() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    // Guardar personas
    save(people) {
        localStorage.setItem(this.storageKey, JSON.stringify(people));
    }

    // Buscar coincidencia con descriptor
    findMatch(descriptor) {
        const people = this.getAll();
        let bestMatch = null;
        let minDistance = Infinity;

        people.forEach(person => {
            person.descriptors.forEach(desc => {
                const distance = this.euclideanDistance(descriptor, desc);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = { person, distance };
                }
            });
        });

        // Solo retorna si está bajo el umbral
        return minDistance < this.threshold ? bestMatch : null;
    }

    // Añadir nuevo descriptor a persona existente o crear nueva
    addDescriptor(descriptor, name = null) {
        const people = this.getAll();
        
        // Buscar si ya existe
        const match = this.findMatch(descriptor);
        
        if (match) {
            // Añadir a persona existente
            const person = match.person;
            console.log('[DB] Añadiendo descriptor a persona existente. Antes:', person.descriptors.length);
            person.descriptors.push(descriptor);
            console.log('[DB] Después:', person.descriptors.length);
            person.lastSeen = Date.now();
            this.save(people);
            return person;
        } else {
            // Crear nueva persona desconocida
            const newPerson = {
                id: 'person_' + Date.now(),
                name: name || null,
                descriptors: [descriptor],
                created: Date.now(),
                lastSeen: Date.now(),
                needsName: !name
            };
            people.push(newPerson);
            this.save(people);
            return newPerson;
        }
    }

    // Asignar nombre a persona
    assignName(personId, name) {
        const people = this.getAll();
        const person = people.find(p => p.id === personId);
        
        if (person) {
            person.name = name;
            person.needsName = false;
            this.save(people);
            return true;
        }
        return false;
    }

    // Verificar si persona tiene suficientes muestras
    hasEnoughSamples(person) {
        return person.descriptors.length >= this.minSamples;
    }

    // Calcular distancia euclidiana
    euclideanDistance(desc1, desc2) {
        let sum = 0;
        for (let i = 0; i < desc1.length; i++) {
            sum += Math.pow(desc1[i] - desc2[i], 2);
        }
        return Math.sqrt(sum);
    }

    // Limpiar base de datos
    clear() {
        localStorage.removeItem(this.storageKey);
    }

    // Obtener estadísticas
    getStats() {
        const people = this.getAll();
        return {
            total: people.length,
            named: people.filter(p => p.name).length,
            unnamed: people.filter(p => !p.name).length
        };
    }

}
