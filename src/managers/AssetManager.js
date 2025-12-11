import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.assets = {}; 
        this.mixers = []; 
    }

    loadAssets(onLoadComplete) {
        const assetsToLoad = [
            { name: 'map', url: '/resources/untitled - Copy.glb' },
            
            // 👇 PASTIKAN BARIS INI AKTIF (JANGAN ADA GARIS MIRING '//' DI DEPANNYA)
            { name: 'steve', url: '/resources/scene1/steve.glb' }, 
        ];

        let loadedCount = 0;

        // ... (Kode material air tetap sama) ...
        const realisticWaterMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0088ff, transmission: 1.0, opacity: 1.0, metalness: 0, roughness: 0.05,
            ior: 1.33, thickness: 1.5, specularIntensity: 1.0, envMapIntensity: 1.0, side: THREE.DoubleSide, transparent: true, depthWrite: false
        });

        assetsToLoad.forEach(item => {
            this.loader.load(item.url, (gltf) => {
                const model = gltf.scene;

                // Setup Animasi & Shadow (Sama seperti sebelumnya)
                if (gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    this.mixers.push(mixer);
                    model.userData.mixer = mixer;
                    model.userData.animations = gltf.animations;
                }

                model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.name === 'water_still') {
                            child.material = realisticWaterMaterial;
                            child.castShadow = false;
                        }
                    }
                });
                
                this.assets[item.name] = model;
                loadedCount++;

                if (loadedCount === assetsToLoad.length) {
                    onLoadComplete();
                }
            }, undefined, (err) => console.error(`Error loading ${item.name}:`, err));
        });
    }

    get(name) { return this.assets[name]; }
    update(delta) { this.mixers.forEach(mixer => mixer.update(delta)); }
}