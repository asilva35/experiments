// --------------------------------------------------------
// 1. SHADERS NATIVOS (GLSL)
// --------------------------------------------------------
const vertexShader = `
  uniform sampler2D uDataTexture;
  uniform float uTime;
  uniform float uNumVertices;
  attribute float aVertexIndex;
  varying vec3 vColor;

  void main() {
    // Calcular coordenadas UV para leer la textura
    // X: Índice del vértice (columna)
    // Y: Tiempo/Frame de la animación (fila)
    float xCoord = (aVertexIndex + 0.5) / uNumVertices; 
    float yCoord = mod(uTime * 0.1, 1.0); 

    vec4 texData = texture2D(uDataTexture, vec2(xCoord, yCoord));
    
    // Decodificar la posición: [0, 1] -> [-4, 4]
    vec3 animatedPos = (texData.rgb * 8.0) - 4.0;
    
    vColor = texData.rgb;

    vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);
    
    // Tamaño de partícula basado en la distancia
    gl_PointSize = 4.0 * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;

  void main() {
    // Hacer que la partícula sea circular
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Brillo central
    float strength = 1.0 - (r * 2.0);
    gl_FragColor = vec4(vColor + strength * 0.5, strength);
  }
`;

// --------------------------------------------------------
// 2. CÁLCULO DE CPU
// --------------------------------------------------------
const calculateCPUData = (count: number, numFrames: number): Uint8Array => {
    const startTime = performance.now();
    console.log('Calculating Particle Sphere CPU data...');
    const data = new Uint8Array(count * numFrames * 4);
    
    const radius = 2.5;

    for (let f = 0; f < numFrames; f++) {
        const frameRatio = f / numFrames;
        // El tiempo influye en la rotación y expansión de la esfera
        const timeOffset = frameRatio * Math.PI * 2;

        for (let i = 0; i < count; i++) {
            // Distribución de puntos en una esfera (Fibonacci Lattice)
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi + timeOffset;

            // Añadir un poco de pulsación orgánica
            const pulsation = 1.0 + Math.sin(phi * 2.0 + timeOffset) * 0.2;
            const r = radius * pulsation;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            // Guardamos la posición directamente en los canales RGB
            // Mapeamos de [-4, 4] a [0, 1] -> [0, 255]
            const map = (val: number) => Math.floor(((val / 8.0) + 0.5) * 255);

            const idx = (f * count + i) * 4;
            data[idx]     = map(x);
            data[idx + 1] = map(y);
            data[idx + 2] = map(z);
            data[idx + 3] = 255; // Alpha
        }
    }

    const endTime = performance.now();
    console.log(`Particle Sphere data calculated in ${endTime - startTime}ms`);
    return data;
};

export { vertexShader, fragmentShader, calculateCPUData };