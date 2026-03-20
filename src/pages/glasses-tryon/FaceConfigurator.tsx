import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Sphere, Text as DreiText } from '@react-three/drei';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { useControls } from 'leva';

const GLASSES_MODELS = [
    { id: 'glasses-01', name: 'Tech Glasses', url: "/models/gltf/glasses-01.glb?v=0.1", thumbnail: "🕶️" },
    { id: 'glasses-02', name: 'Style Glasses', url: "/models/gltf/glasses-02.glb?v=0.1", thumbnail: "👓" },
];

// --- 1. EL OCULSOR (LA CABEZA INVISIBLE) ---
interface OccluderProps {
    debug: boolean;
    scale: [number, number, number];
    position: [number, number, number];
}

function FaceOccluder({ debug, scale, position }: OccluderProps) {
    return (
        <Sphere
            args={[1, 32, 32]}
            scale={scale}
            position={position}
            renderOrder={0}
        >
            <meshBasicMaterial
                color="red"
                transparent={false}
                colorWrite={debug}
                depthWrite={true}
            />
        </Sphere>
    );
}

// --- 2. EL MODELO DE LENTES (SOLO VISUAL) ---
function Glasses({ url }: { url: string }) {
    const { scene } = useGLTF(url);

    // Forzamos un renderOrder superior en todos los materiales de los lentes
    useEffect(() => {
        scene.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                child.renderOrder = 10; // Mucho mayor que el oclusor
            }
        });
    }, [scene]);

    return <primitive object={scene} />;
}

// --- 3. EL CONTENEDOR LÓGICO (MATEMÁTICA) ---
function FaceTrackerContainer({
    landmarks,
    children,
    modelUrl
}: {
    landmarks: any,
    children: React.ReactNode,
    modelUrl: string
}) {
    const groupRef = useRef<THREE.Group>(null!);
    const { camera } = useThree();

    // Controles de calibración en tiempo real
    const { xOffset, yOffset, zOffset, scaleAdjust, yawFactor, pitchFactor, smoothingFactor } = useControls('Glasses (Calibration)', {
        xOffset: { value: 0, min: -1.5, max: 1.5, step: 0.01 },
        yOffset: { value: 0, min: -1.5, max: 1.5, step: 0.01 },
        zOffset: { value: -2.5, min: -8, max: 0, step: 0.1 },
        scaleAdjust: { value: 1.0, min: 0.1, max: 3.0, step: 0.01 },
        yawFactor: { value: 3.0, min: 0, max: 50, step: 1 },
        pitchFactor: { value: 1.5, min: 0, max: 5, step: 0.1 },
        smoothingFactor: { value: 0.30, min: 0.01, max: 1.0, step: 0.01 },
    }, { collapsed: true });

    const { debugOccluder, occluderZ, headWidth, headHeight, headDepth } = useControls('Occluder (Head)', {
        debugOccluder: false,
        occluderZ: { value: -2.0, min: -2, max: 2, step: 0.05 },
        headWidth: { value: 2.3, min: 0.1, max: 5, step: 0.1 },
        headHeight: { value: 1.3, min: 0.1, max: 5, step: 0.1 },
        headDepth: { value: 1.7, min: 0.1, max: 5, step: 0.1 },
    }, { collapsed: true });

    const { debugPoints } = useControls('Debug', {
        debugPoints: false,
    }, { collapsed: true });

    const LANDMARK_NAMES: Record<number, string> = {
        168: "Bridge (Anchor)",
        6: "Nose Point",
        33: "Left Eye",
        263: "Right Eye",
        234: "Left Cheek (Yaw)",
        454: "Right Cheek (Yaw)",
        152: "Chin",
        10: "Forehead"
    };

    // Helper matemático infalible para mapear 2D -> 3D real
    const getUnprojectedPosition = (ndcX: number, ndcY: number, targetZ: number) => {
        const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        const dist = (targetZ - camera.position.z) / vec.z;
        return new THREE.Vector3().copy(camera.position).add(vec.multiplyScalar(dist));
    };

    // Usamos getObjectByName para evitar el tipo 'never' y casteamos a Object3D para seguridad de TS
    const { scene } = useGLTF(modelUrl);
    const anchors = React.useMemo(() => {
        const nose = scene.getObjectByName('ANCHOR_NOSE') as THREE.Object3D | undefined;
        const leftEye = scene.getObjectByName('ANCHOR_LEYE') as THREE.Object3D | undefined;
        const rightEye = scene.getObjectByName('ANCHOR_REYE') as THREE.Object3D | undefined;

        return {
            nose: nose ? nose.position.clone() : new THREE.Vector3(0, 0, 0),
            leftEye: leftEye ? leftEye.position.clone() : new THREE.Vector3(-0.06, 0, 0),
            rightEye: rightEye ? rightEye.position.clone() : new THREE.Vector3(0.06, 0, 0),
        };
    }, [scene]);

    useFrame(() => {
        if (landmarks && landmarks.length > 0 && groupRef.current) {
            // Utilizamos el puente nasal (168) como anchor principal para los lentes
            const bridge = landmarks[168];
            const noseTip = landmarks[6];
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const leftCheek = landmarks[454];
            const rightCheek = landmarks[234];

            const targetZ = zOffset;

            // --- 1. ROTACIÓN (Roll, Pitch, Yaw) ---
            // Se calcula primero porque afecta la posición y escala offset
            const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
            const targetYaw = (leftCheek.z - rightCheek.z) * yawFactor;
            const targetPitch = (noseTip.z - bridge.z) * pitchFactor;

            const currentRotX = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, smoothingFactor);
            const currentRotY = -THREE.MathUtils.lerp(-groupRef.current.rotation.y, targetYaw, smoothingFactor);
            groupRef.current.rotation.set(currentRotX, currentRotY, roll);

            // --- 2. ESCALADO (Anclas vs Mundo Real) ---
            const lNdcX = -(leftEye.x - 0.5) * 2;
            const lNdcY = -(leftEye.y - 0.5) * 2;
            const rNdcX = -(rightEye.x - 0.5) * 2;
            const rNdcY = -(rightEye.y - 0.5) * 2;

            const posLeftEyeW = getUnprojectedPosition(lNdcX, lNdcY, targetZ);
            const posRightEyeW = getUnprojectedPosition(rNdcX, rNdcY, targetZ);
            const worldEyeDist = posLeftEyeW.distanceTo(posRightEyeW);

            const modelEyeDist = anchors.leftEye.distanceTo(anchors.rightEye);

            // finalScale garantiza que los ANCHOR_EYE cubran EXACTO la distancia de tus pupilas
            const finalScale = (worldEyeDist / modelEyeDist) * scaleAdjust;
            groupRef.current.scale.setScalar(finalScale);

            // --- 3. POSICIÓN (Mapeo de Ancla) ---
            // Encontramos el puente nasal en nuestro 3D world
            const ndcX = -(bridge.x - 0.5) * 2;
            const ndcY = -(bridge.y - 0.5) * 2;
            const pos3D = getUnprojectedPosition(ndcX, ndcY, targetZ);

            // Calculamos cuánto se despaza el ANCHOR_NOSE del centro del modelo
            // Tomamos en cuenta la rotación actual y la escala
            const noseOffset = anchors.nose.clone()
                .applyEuler(groupRef.current.rotation)
                .multiplyScalar(finalScale);

            // Restamos el offset para que el ANCHOR_NOSE colisione exactamente con el puente 3D
            const posX = pos3D.x - noseOffset.x + xOffset;
            const posY = pos3D.y - noseOffset.y + yOffset;

            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, posX, smoothingFactor);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, posY, smoothingFactor);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, smoothingFactor);
        }
    });

    return (
        <>
            <group ref={groupRef}>
                <FaceOccluder
                    debug={debugOccluder}
                    scale={[headWidth, headHeight, headDepth]}
                    position={[0, -0.1, occluderZ]}
                />
                {children}
            </group>

            {/* Visualización de puntos de referencia para depuración */}
            {debugPoints && landmarks && (
                <group>
                    {/* Mostramos más puntos para entender el "fit" (ojos, nariz, labios, contorno) */}
                    {Object.keys(LANDMARK_NAMES).map((key) => {
                        const idx = parseInt(key);
                        const p = landmarks[idx];

                        // Calculamos NDC invirtiendo el X porque el video está en espejo
                        const pNdcX = -(p.x - 0.5) * 2;
                        const pNdcY = -(p.y - 0.5) * 2;

                        // Cada punto tiene una profundidad ligeramente distinta (p.z) para formar la cara 3D
                        // Lo proyectamos EXACTAMENTE sobre esa profundidad, por lo que visualmente no se desplaza
                        const pointZ = zOffset + (p.z * -15);
                        const exactPos = getUnprojectedPosition(pNdcX, pNdcY, pointZ);

                        return (
                            <group key={idx} position={[exactPos.x + xOffset, exactPos.y + yOffset, exactPos.z]}>
                                <Sphere args={[0.012, 16, 16]}>
                                    <meshBasicMaterial
                                        color={idx === 168 ? "yellow" : idx === 6 ? "red" : "lime"}
                                        depthTest={false}
                                        transparent={true}
                                        opacity={0.8}
                                    />
                                </Sphere>
                                <DreiText
                                    position={[0.02, 0.015, 0]}
                                    fontSize={0.15}
                                    color="white"
                                    anchorX="left"
                                    anchorY="bottom"
                                    material-depthTest={false}
                                >
                                    {LANDMARK_NAMES[idx]}
                                </DreiText>
                            </group>
                        );
                    })}
                </group>
            )}
        </>
    );
}

// --- 4. COMPONENTE PRINCIPAL ---
export default function FaceConfigurator() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [faceData, setFaceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let landmarker: FaceLandmarker;
        let animationFrameId: number;

        const setup = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                landmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                if (videoRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 1280, height: 720 }
                    });
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setLoading(false);
                        predict();
                    };
                }
            } catch (err) { console.error(err); }
        };

        const predict = () => {
            if (videoRef.current && videoRef.current.readyState >= 3) {
                const results = landmarker.detectForVideo(videoRef.current, performance.now());
                if (results.faceLandmarks.length > 0) {
                    setFaceData(results.faceLandmarks[0]);
                }
            }
            animationFrameId = requestAnimationFrame(predict);
        };

        setup();
        return () => {
            cancelAnimationFrame(animationFrameId);
            landmarker?.close();
        };
    }, []);

    const [currentModel, setCurrentModel] = useState(GLASSES_MODELS[0]);
    const [modelLoading, setModelLoading] = useState(false);

    // Efecto para simular carga o resetear estados si el modelo cambia
    useEffect(() => {
        setModelLoading(true);
        // Pequeño timeout para asegurar que el Suspense o el loader visual se note si es muy rápido
        const timer = setTimeout(() => setModelLoading(false), 500);
        return () => clearTimeout(timer);
    }, [currentModel.url]);

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden font-sans">
            {(loading || modelLoading) && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-lg font-medium tracking-widest animate-pulse">
                        {loading ? "Vision System..." : `Loading ${currentModel.name}...`}
                    </p>
                </div>
            )}

            <video ref={videoRef} className="absolute inset-0 w-full h-full object-fill scale-x-[-1]" playsInline />

            <Canvas className="absolute inset-0 z-10 shadow-inner">
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />

                {/* Aquí está el cambio: El contenedor envuelve a los lentes */}
                <React.Suspense fallback={null}>
                    <FaceTrackerContainer landmarks={faceData} modelUrl={currentModel.url}>
                        <Glasses url={currentModel.url} />
                    </FaceTrackerContainer>
                </React.Suspense>
            </Canvas>

            {/* BARRA INFERIOR DE SELECCIÓN DE LENTES */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-4 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl transition-all hover:bg-black/50">
                {GLASSES_MODELS.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => setCurrentModel(model)}
                        className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-xl transition-all duration-300 ${currentModel.id === model.id
                            ? 'bg-white/20 border-2 border-white/50 scale-105 shadow-lg'
                            : 'bg-white/5 border border-white/5 hover:bg-white/10'
                            }`}
                    >
                        <span className="text-4xl mb-1 group-hover:scale-110 transition-transform">{model.thumbnail}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">{model.name}</span>
                        {currentModel.id === model.id && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black" />
                        )}
                    </button>
                ))}
            </div>

            <div className="absolute top-6 left-6 z-40 flex flex-col gap-2">
                <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                    <h1 className="text-white font-bold tracking-tight">Glasses Try-On</h1>
                    <p className="text-white/50 text-[10px] uppercase tracking-widest">Choose a glass to try on</p>
                </div>
            </div>
        </div>
    );
}