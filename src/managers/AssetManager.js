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

            // 👇 Path Steve sesuai request Anda
            { name: 'steve', url: '/resources/scene1/steve.glb' },

            // 👇 FURNITURE BARU (Pastikan file ada di folder resources)
            { name: 'chest', url: '/resources/scene1/Chest.glb' },
            { name: 'torch', url: '/resources/scene1/Torch.glb' },
            { name: 'pickaxe', url: '/resources/scene1/Pickaxe.glb' },
        ];

        let loadedCount = 0;
        const totalAssets = assetsToLoad.length; // Hitung total file

        // Fungsi cek status agar tidak macet jika ada file error
        const checkLoadStatus = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                onLoadComplete();
            }
        };

        // Kode material air tetap sama
        const realisticWaterMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0088ff, transmission: 1.0, opacity: 1.0, metalness: 0, roughness: 0.05,
            ior: 1.33, thickness: 1.5, specularIntensity: 1.0, envMapIntensity: 1.0, side: THREE.DoubleSide, transparent: true, depthWrite: false
        });

        assetsToLoad.forEach(item => {
            this.loader.load(
                item.url,
                (gltf) => {
                    const model = gltf.scene;

                    // Setup Animasi & Shadow
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
                    console.log(`✅ Loaded: ${item.name}`);
                    checkLoadStatus(); // Panggil cek status
                },
                // onProgress
                undefined,
                // onError (PENTING: Tetap panggil checkLoadStatus biar tidak macet loadingnya)
                (err) => {
                    console.error(`❌ Error loading ${item.name}:`, err);
                    checkLoadStatus();
                }
            );
        });
    }

    get(name) { return this.assets[name]; }
    update(delta) { this.mixers.forEach(mixer => mixer.update(delta)); }
}