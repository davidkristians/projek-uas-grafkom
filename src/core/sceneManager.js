import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

export function createScene() {
    const scene = new THREE.Scene();
    return scene;
}

export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);

    // A. Render Pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // B. GTAO Pass
    const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    gtaoPass.blendIntensity = 1.0; 
    gtaoPass.scale = 1.5;         
    composer.addPass(gtaoPass);

    // C. Bloom Pass
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        0.2, // Strength
        0.4, // Radius
        0.85 // Threshold
    );
    composer.addPass(bloomPass);

    // D. Output Pass
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    return composer;
}