export const WALL_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const WALL_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

uniform vec3 uColor;
uniform vec3 uNoiseColor;
uniform float uNoiseScale;
uniform float uBumpStrength;

// Generic 2D noise
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Multi-layered noise for stucco/plaster texture
    float n = noise(vUv * uNoiseScale);
    n += noise(vUv * uNoiseScale * 2.1) * 0.5;
    n += noise(vUv * uNoiseScale * 4.3) * 0.25;
    n += noise(vUv * uNoiseScale * 8.7) * 0.125;
    
    // Normalize noise
    n = n / 1.875;
    
    // Fake lighting based on noise gradient (bump effect)
    float dx = noise(vUv * uNoiseScale + vec2(0.01, 0.0)) - n;
    float dy = noise(vUv * uNoiseScale + vec2(0.0, 0.01)) - n;
    vec3 bumpNormal = normalize(vec3(dx * uBumpStrength, dy * uBumpStrength, 1.0));
    
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    float diffuse = max(dot(bumpNormal, lightDir), 0.0);
    
    // Base color mix with noise color for the "valleys" of the stucco
    vec3 baseColor = mix(uNoiseColor, uColor, n);
    vec3 finalColor = baseColor * (0.9 + 0.2 * diffuse);
    
    // Micro-pitting
    float pits = smoothstep(0.4, 0.3, noise(vUv * uNoiseScale * 15.0));
    finalColor = mix(finalColor, finalColor * 0.8, pits * 0.3);

    // Procedural Ambient Occlusion Simulation on edges
    // Based on UVs (assumes mesh has standard 0-1 UVs)
    float aoRange = 0.05; // How far from the edge the AO starts
    float aoStrength = 0.4;
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float ao = smoothstep(0.0, aoRange, edgeDist);
    
    // Apply AO (darken corners/edges)
    finalColor *= mix(1.0 - aoStrength, 1.0, ao);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;
