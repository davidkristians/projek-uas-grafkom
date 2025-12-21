import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.audioLoader = new THREE.AudioLoader();
        this.assets = {};
        this.audioBuffers = {};
        this.mixers = [];
    }

    loadAssets(onLoadComplete) {
        const assetsToLoad = [
            // --- GLOBAL & SCENE 1 ---
            { name: 'map', url: '/resources/untitled - Copy.glb' },
            { name: 'steve', url: '/resources/scene1/steve.glb' },
            { name: 'chest', url: '/resources/scene1/Chest.glb' },
            { name: 'torch', url: '/resources/scene1/Torch.glb' },
            { name: 'pickaxe', url: '/resources/scene1/Pickaxe.glb' },
            { name: 'door', url: '/resources/scene1/wooden_door.glb' },
            { name: 'door2', url: '/resources/scene1/wooden_door.glb' },

            // --- SCENE 2 ---
            { name: 'alex', url: '/resources/scene2/alex.glb' },

            // --- SCENE 3 ---
            { name: 'furnace', url: '/resources/scene3/furnace_on.glb' },
            { name: 'furnace2', url: '/resources/scene3/furnace_on.glb' },
            { name: 'crafting_table', url: '/resources/scene3/crafting_table.glb' },
            { name: 'minecraft_chest', url: '/resources/scene3/minecraft_chest.glb' },
            { name: 'villager', url: '/resources/scene2/villager.glb' },
            { name: 'bee', url: '/resources/scene2/bee.glb' },
            { name: 'fox', url: '/resources/scene2/fox.glb' },
            { name: 'steve_walk', url: '/resources/scene2/steve_walk.glb' },

            // --- SCENE 4 ---
            { name: 'alex_walk', url: '/resources/scene3/minecraft_alex_character_animated (2).glb' },

            // --- SCENE 5 (MOBS) ---
            { name: 'zombie', url: '/resources/scene5/zombie.glb' },
            { name: 'skeleton', url: '/resources/scene5/skeleton.glb' },
            { name: 'spider', url: '/resources/scene5/spider.glb' },
            { name: 'creeper', url: '/resources/scene5/creeper.glb' },
            { name: 'enderman', url: '/resources/scene5/enderman.glb' }
        ];

        const audioToLoad = [
            { name: 'bgm_minecraft', url: '/sound/1-08. Minecraft.mp3' },
            { name: 'bgm_night', url: '/sound/cave21.mp3' },
            { name: 'door_open', url: '/sound/MC Door Open.mp3' },
            { name: 'door_close', url: '/sound/MC Door Close.mp3' },
            { name: 'walk', url: '/sound/minecraft-grass-walking-sound-effect.mp3' },
            { name: 'click', url: '/sound/minecraft---menu-click-2-made-with-Voicemod.mp3' },
            { name: 'frying', url: '/sound/zapsplat_food_frying_pepper_and_onions_pan_stir_with_wooden_spoon_11799-1.mp3' },
            { name: 'anvil', url: '/sound/anvil-use-minecraft-sound-sound-effect-for-editing.mp3' },
            { name: 'heartbeat', url: '/sound/heartbeat-slow-to-fast.wav' },
            // Mobs
            { name: 'mob_skeleton', url: '/sound/mobs/minecraft-skeleton-bone.mp3' },
            { name: 'mob_zombie', url: '/sound/mobs/old-sound-of-zombie-in-minecraft.mp3' },
            { name: 'mob_enderman', url: '/sound/mobs/teleport1_Cw1ot9l.mp3' }
        ];

        let loadedCount = 0;
        const totalAssets = assetsToLoad.length + audioToLoad.length;

        const checkLoadStatus = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                onLoadComplete();
            }
        };

        const realisticWaterMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0088ff, transmission: 1.0, opacity: 0.7, metalness: 0, roughness: 0.05,
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
                    checkLoadStatus();
                },
                undefined,
                (err) => {
                    console.error(`❌ Error loading ${item.name}:`, err);
                    checkLoadStatus();
                }
            );
        });

        audioToLoad.forEach(item => {
            this.audioLoader.load(
                item.url,
                (buffer) => {
                    this.audioBuffers[item.name] = buffer;
                    console.log(`🎵 Loaded Audio: ${item.name}`);
                    checkLoadStatus();
                },
                undefined,
                (err) => {
                    console.error(`❌ Error loading audio ${item.name}:`, err);
                    checkLoadStatus();
                }
            );
        });
    }

    get(name) { return this.assets[name]; }
    getAudio(name) { return this.audioBuffers[name]; }
    update(delta) { this.mixers.forEach(mixer => mixer.update(delta)); }
}