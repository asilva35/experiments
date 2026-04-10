export const WOOD_FLOOR_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const WOOD_FLOOR_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vPosition;
uniform vec2 uRepeat;
uniform float uRotation;
uniform vec3 uColorLight;
uniform vec3 uColorDark;

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

vec2 rotateUV(vec2 uv, float rotation) {
    float mid = 0.5;
    return vec2(
        cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
        cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
}

void main() {
    // Rotate UVs
    vec2 rotatedUv = rotateUV(vUv, uRotation);
    
    // Scaling for the floor planks
    vec2 uv = rotatedUv * vec2(10.0, 2.0) * uRepeat; 
    
    // Plank ID based on floor
    float plankId = floor(uv.x);
    float rowId = floor(uv.y);
    
    // Offset each row to create a staggered effect
    float offset = hash(vec2(rowId, 1.0)) * 10.0;
    float plankIndex = floor(uv.x + offset);
    
    // Local plank UV
    vec2 plankUv = fract(vec2(uv.x + offset, uv.y));
    
    // Plank specific noise for color variation
    float plankSeed = hash(vec2(plankIndex, rowId));
    
    // Grain simulation
    float v = noise(vec2(plankUv.x * 2.0, plankUv.y * 20.0) + plankSeed * 10.0);
    v += noise(vec2(plankUv.x * 5.0, plankUv.y * 40.0)) * 0.5;
    
    // Colors inspired by the reference image
    // Fallback if colors aren't passed (handled by uniforms initialization usually, 
    // but here we just use the lightWood/darkWood variables)
    vec3 lightWood = uColorLight; 
    vec3 darkWood = uColorDark; 
    
    // Apply plank variation
    vec3 baseColor = lightWood * (0.85 + plankSeed * 0.3);
    
    // Mix colors based on grain
    vec3 color = mix(baseColor, darkWood, v * 0.4);
    
    // Plank edges (subtle dark lines)
    float edgeWidth = 0.02;
    float edges = smoothstep(0.0, edgeWidth, plankUv.x) * 
                  smoothstep(1.0, 1.0 - edgeWidth, plankUv.x) *
                  smoothstep(0.0, edgeWidth * 5.0, plankUv.y) * 
                  smoothstep(1.0, 1.0 - edgeWidth * 5.0, plankUv.y);
                  
    color *= 0.9 + 0.1 * edges;
    
    gl_FragColor = vec4(color, 1.0);
}
`;
