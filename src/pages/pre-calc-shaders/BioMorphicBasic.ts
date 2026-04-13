// --------------------------------------------------------
// 2. SHADERS NATIVOS (GLSL)
// --------------------------------------------------------
const vertexShader = `
  uniform sampler2D uDataTexture;
  uniform float uTime;
  uniform float uNumVertices;
  attribute float aVertexIndex;
  varying float vNoise;

  void main() {
    float xCoord = (aVertexIndex + 0.5) / uNumVertices; 
    float yCoord = mod(uTime * 0.3, 1.0); 

    vec4 texData = texture2D(uDataTexture, vec2(xCoord, yCoord));
    float noiseVal = (texData.r * 2.0) - 1.0;
    vNoise = noiseVal;
    
    vec3 newPos = position + normal * noiseVal * 0.8;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uColorD;
  varying float vNoise;

  void main() {
    float mixFactor = smoothstep(-0.8, 0.8, vNoise); 
    vec3 finalColor = mix(uColorD, uColor, mixFactor);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// --------------------------------------------------------
// 3. CÁLCULO DE CPU
// --------------------------------------------------------
const calculateCPUData = (count: number, numFrames: number): Uint8Array => {
    // TIME THE CALCULATION
    const startTime = performance.now();
    console.log('Calculating CPU data...');
    const data = new Uint8Array(count * numFrames * 4);
    // Simulación de ruido simple para la CPU
    for (let f = 0; f < numFrames; f++) {
        const t = (f / numFrames) * Math.PI * 3;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 10;
            const n = Math.sin(angle + t) * Math.cos(angle * 0.5 - t);
            const mapped = ((n + 1.0) / 2.0) * 255;
            const idx = (f * count + i) * 4;
            data[idx] = Math.floor(mapped);
            data[idx + 1] = Math.floor(mapped * 0.8); // G
            data[idx + 2] = Math.floor(mapped * 1.2); // B
            data[idx + 3] = 255;
        }
    }

    const endTime = performance.now();
    console.log(`CPU data calculated in ${endTime - startTime}ms`);
    return data;
};

export { vertexShader, fragmentShader, calculateCPUData };