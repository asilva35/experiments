import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { GLTF } from 'three-stdlib'

// Definimos la interfaz para extender el tipo GLTF estándar
interface GLTFResult extends GLTF {
    nodes: { [key: string]: THREE.Object3D }
    materials: { [key: string]: THREE.Material }
}

interface DynamicModelProps {
    url: string
    onPOIsDetected: (pois: any[]) => void
}

export function DynamicModel({ url, onPOIsDetected }: DynamicModelProps) {
    // Forzamos a TS a entender que viene un solo objeto GLTFResult
    const { scene } = useGLTF(url) as GLTFResult

    const detectedPois = useMemo(() => {
        const found: any[] = []

        scene.traverse((child) => {
            // Lógica de detección por nombre: POI_Nombre_Subtitulo_ColorHex
            console.log("Child name:", child.name);
            if (child.name.startsWith('POI_')) {
                const parts = child.name.split('_')
                const worldPos = new THREE.Vector3()
                child.getWorldPosition(worldPos)

                found.push({
                    title: parts[1] || "Destino",
                    subtitle: parts[2] || "Referencia",
                    desc: "Punto detectado automáticamente desde el archivo GLB.",
                    pos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
                    color: parts[3] ? `#${parts[3]}` : "#ffffff",
                    img: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=600"
                })

                // Ocultamos el nodo original para que no choque visualmente con nuestro PIN
                child.visible = false
            }
        })
        return found
    }, [scene])

    // Notificar al componente padre cuando cambien los POIs detectados
    useEffect(() => {
        onPOIsDetected(detectedPois)
    }, [detectedPois, onPOIsDetected])

    return <primitive object={scene} />
}

// Muy importante para el performance: limpiar el caché de la URL al desmontar
//useGLTF.preload = (url: string) => useGLTF.preload(url)