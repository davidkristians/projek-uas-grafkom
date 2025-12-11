import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let water = null; // Menyimpan referensi air untuk dianimasikan

export function loadMap(scene) {
    const realisticWaterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0088ff,
        transmission: 1.0,
        opacity: 1.0,
        metalness: 0,
        roughness: 0.05,
        ior: 1.33,
        thickness: 1.5,
        specularIntensity: 1.0,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide
    });

    const loader = new GLTFLoader();
    loader.load(
        '../public/resources/untitled - Copy.glb', 
        (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.shadowSide = THREE.DoubleSide;

                    if (child.material.map) {
                        child.material.transparent = false; 
                        child.material.alphaTest = 0.5; 
                        child.material.depthWrite = true;
                        child.material.depthTest = true;
                        child.material.side = THREE.DoubleSide; 
                    }
                }
            });

            // Setup Air
            const waterMesh = model.getObjectByName('water_still');
            if (waterMesh) {
                waterMesh.material = realisticWaterMaterial;
                waterMesh.material.transparent = true;
                waterMesh.material.depthWrite = false;
                waterMesh.castShadow = false; 
                waterMesh.receiveShadow = true;
                water = waterMesh; // Simpan ke variabel global module
            }

            scene.add(model);
        },
        undefined,
        (error) => console.error(error)
    );
}

// Fungsi untuk update animasi air di loop utama
export function updateMapAnimation() {
    // Karena kamu pakai MeshPhysicalMaterial, animasi ombaknya tidak pakai uniforms['time']
    // Kecuali kamu pakai objek Water dari addon.
    // Kode kamu sebelumnya tidak mengupdate time, jadi fungsi ini bisa kosong
    // atau digunakan jika nanti kamu pakai shader air custom.
}