import { useRef, useMemo, Suspense, useEffect, useState, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, useTexture, Stats } from '@react-three/drei';
import { EffectComposer, DotScreen, ChromaticAberration } from '@react-three/postprocessing';
import { gsap } from 'gsap'


// Definición de Shaders extraída fuera del componente para mejor rendimiento
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Distancia del mouse en espacio UV
    float dist = distance(uv, uMouse );
    
    // Ondulación base constante
    float wave = sin(pos.x * 2.0 + uTime) * 0.12;
    wave += cos(pos.y * 2.0 + uTime) * 0.12;
    
    // Elevación por proximidad del mouse
    float mouseInfluence = smoothstep(0.45, 0.0, dist);
    pos.z += wave + (mouseInfluence * 1.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uGridSize;
  uniform float uGap;
  uniform float uGrayScale;
  uniform float uTime;

  void main() {
    // Cálculo del mosaico
    vec2 gridUv = floor(vUv * uGridSize) / uGridSize;
    vec2 fractUv = fract(vUv * uGridSize);

    // Descartar píxeles en los bordes para crear los huecos
    if (fractUv.x < uGap || fractUv.x > (1.0 - uGap) || 
        fractUv.y < uGap || fractUv.y > (1.0 - uGap)) {
      discard;
    }

    // Obtener el color de la textura
    vec4 color = texture2D(uTexture, gridUv + (0.5 / uGridSize));
    
    // Efecto sutil de iluminación
    color.rgb *= 0.85 + 0.15 * sin(vUv.y * 15.0);

    // RUIDO SIMPLE (Más rápido que el post-process)
    float n = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    color.rgb += n * 0.05;

    // VIGNETTE SIMPLE
    float dist = distance(vUv, vec2(0.5));
    color.rgb *= smoothstep(0.8, 0.2, dist * 0.7);

    // Gray Scale
    float gray = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    color.rgb = mix(color.rgb, vec3(gray), uGrayScale);

    gl_FragColor = color;
  }
`;

const InteractivePlane = ({ position, grayScale, interactivePlaneFocus }: { position: [number, number, number], grayScale: number, interactivePlaneFocus: boolean }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [isInteractive, setIsInteractive] = useState(true);

  // useTexture de drei es más estable y maneja automáticamente la compatibilidad y caché
  const texture = useTexture('/images/picture.jpeg');

  // Inicializamos los uniformes
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: texture },
      uMouse: { value: new THREE.Vector2(0.0, 0.0) },
      uGridSize: { value: 45.0 },
      uGap: { value: 0.12 },
      uGrayScale: { value: 0.0 },
    }),
    [texture]
  );

  useEffect(() => {
    setIsInteractive(!interactivePlaneFocus);
  }, [interactivePlaneFocus])

  useFrame((state) => {
    if (materialRef.current) {
      if (isInteractive) {
        // Actualizamos el tiempo de la ola
        materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

        // Suavizado progresivo del GrayScale
        materialRef.current.uniforms.uGrayScale.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uGrayScale.value,
          grayScale,
          0.1
        );

        // Actualizamos y suavizamos la posición del mouse
        const targetMouseX = (state.mouse.x + 1) / 2;
        const targetMouseY = (state.mouse.y + 1) / 2;

        materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uMouse.value.x,
          targetMouseX,
          0.1
        );
        materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uMouse.value.y,
          targetMouseY,
          0.1
        );
      }
    }
  });

  return (
    <mesh rotation={[-0.1, 0, 0]} position={position}>
      <planeGeometry args={[6, 4, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const GroupPlane = forwardRef<THREE.Group, { totalPlanes: number, isTransitioning: boolean, interactivePlaneFocus: boolean }>(({ totalPlanes, isTransitioning, interactivePlaneFocus }, ref) => {
  const [grayScale, setGrayScale] = useState(0.0);
  useEffect(() => {
    if (isTransitioning) {
      setGrayScale(1.0);
    } else {
      setGrayScale(0.0);
    }
  }, [isTransitioning])
  return (
    <group ref={ref}>
      {Array.from({ length: totalPlanes }).map((_, i) => (
        <InteractivePlane key={i} position={[0, i * -5, 0]} grayScale={grayScale} interactivePlaneFocus={interactivePlaneFocus} />
      ))}
    </group>
  )
})

export default function App() {
  const [interactivePlaneFocus, setInteractivePlaneFocus] = useState(false);
  const scrollBounceRef = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const indexRef = useRef(0);
  const totalPlanes = 10;
  const [postProcessing, setPostProcessing] = useState(true);

  const handleNextManual = () => {
    if (indexRef.current < totalPlanes - 1) {
      indexRef.current++;
      gsap.to(groupRef.current!.position, {
        y: indexRef.current * 5,
        duration: 1.2,
        ease: 'power3.inOut',
        onComplete: () => {
          setIsTransitioning(false)
        }
      });
    } else {
      // Bounce Effect (Al final de la lista)
      gsap.to(groupRef.current!.position, {
        y: indexRef.current * 5 + 0.8,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(groupRef.current!.position, {
            y: indexRef.current * 5,
            duration: 0.6,
            ease: 'elastic.out(1, 0.5)',
            onComplete: () => {
              setIsTransitioning(false)
            }
          });
        }
      });
    }
  }

  const handlePrevManual = () => {
    if (indexRef.current > 0) {
      indexRef.current--;
      gsap.to(groupRef.current!.position, {
        y: indexRef.current * 5,
        duration: 1.2,
        ease: 'power3.inOut',
        onComplete: () => {
          setIsTransitioning(false)
        }
      });
    } else {
      // Bounce Effect (Al inicio de la lista)
      gsap.to(groupRef.current!.position, {
        y: indexRef.current * 5 - 0.8,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(groupRef.current!.position, {
            y: indexRef.current * 5,
            duration: 0.6,
            ease: 'elastic.out(1, 0.5)',
            onComplete: () => {
              setIsTransitioning(false)
            }
          });
        }
      });
    }
  }

  const handleFocusPlane = () => {
    setInteractivePlaneFocus(!interactivePlaneFocus)
    if (interactivePlaneFocus) {
      setPostProcessing(true);
    }
    gsap.to(groupRef.current!.position, {
      z: interactivePlaneFocus ? 0 : 5,
      duration: 1.2,
      ease: 'power3.inOut',
      onComplete: () => {
        if (!interactivePlaneFocus) {
          setPostProcessing(false);
        }
      }
    });
  }

  useEffect(() => {
    if (interactivePlaneFocus) return

    let timer: ReturnType<typeof setTimeout>
    const handleWheel = (e: WheelEvent) => {
      if (isTransitioning) return

      scrollBounceRef.current += e.deltaY

      if (Math.abs(scrollBounceRef.current) > 100 && indexRef.current <= totalPlanes - 1 && indexRef.current >= 0) {
        if (scrollBounceRef.current > 0) {
          handleNextManual()
        } else {
          handlePrevManual()
        }
        scrollBounceRef.current = 0
        setIsTransitioning(true)
      }

      clearTimeout(timer)
      timer = setTimeout(() => {
        scrollBounceRef.current = 0
      }, 150)
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      clearTimeout(timer)
    }
  }, [isTransitioning, handleNextManual, handlePrevManual])

  return (
    <div className="w-full h-screen bg-neutral-950">
      <div className="absolute top-10 left-10 z-10 text-white select-none pointer-events-none font-sans">
        <h1 className="text-4xl font-black tracking-tighter mb-1 uppercase">Shader Mosaic</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Interacción en tiempo real</p>
        </div>
      </div>

      {/* Simplificamos la cámara inyectándola en el Canvas para evitar bugs de dependencias */}
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />

        <Stats />
        {/* Suspense es obligatorio cuando usamos carga de texturas */}
        <Suspense fallback={null}>
          <GroupPlane ref={groupRef} totalPlanes={totalPlanes} isTransitioning={isTransitioning} interactivePlaneFocus={interactivePlaneFocus} />
        </Suspense>

        {postProcessing && (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <DotScreen
              angle={Math.PI * 0.125}
              scale={1.2}
            />
            <ChromaticAberration
              offset={new THREE.Vector2(0.0015, 0.0015)}
            />
          </EffectComposer>
        )}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 2.4}
        />
      </Canvas>

      <div className="absolute bottom-10 left-10 right-10 z-10 flex justify-between items-end pointer-events-none select-none">
        <div className="max-w-[250px] text-[10px] text-white/30 leading-relaxed uppercase tracking-widest">
          Geometría deformada por distancia euclidiana. Descarte de fragmentos por UV fraccional.
        </div>
        <div className="text-white/20 text-[10px] font-mono">
          WEBGL // R3F // GLSL
        </div>
      </div>

      {/** Button Focus Plane */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => handleFocusPlane()}
          className="w-60 h-12 bg-black/20 border border-white/20 hover:border-white/50 hover:bg-black/50 transition-colors duration-300 rounded-full flex items-center justify-center cursor-pointer"
        >
          VIEW PLANE
        </button>
      </div>
    </div>
  );
}