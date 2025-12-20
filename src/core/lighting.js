import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Sky } from 'three/addons/objects/Sky.js';

export function setupLighting(scene) {
    // 1. HDRI / Sky (Default Day)
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
        '/public/resources/citrus_orchard_road_puresky_2k.hdr',
        function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
            scene.backgroundIntensity = 0.5;
            scene.environmentIntensity = 0.5;
        }
    );

    // 2. Sun Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);

    // Posisi Matahari
    const sunPosition = { x: 50, y: 100, z: 50 };
    sunLight.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
    sunLight.castShadow = true;

    // Shadow Settings
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.radius = 2;

    // Area Bayangan
    const shadowSize = 300;
    const shadowFar = 500;
    sunLight.shadow.camera.left = -shadowSize;
    sunLight.shadow.camera.right = shadowSize;
    sunLight.shadow.camera.top = shadowSize;
    sunLight.shadow.camera.bottom = -shadowSize;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = shadowFar;

    scene.add(sunLight);

    // --- PROCEDURAL SKY SETUP ---
    const sky = new Sky();
    sky.scale.setScalar(450000);
    sky.visible = false; // Hidden at first
    scene.add(sky);

    const sun = new THREE.Vector3();

    // Sky Parameters
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 3;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.7;

    return { sunLight, sky, sun };
}

export function updateSunPosition(sky, sunLight, elevation, azimuth, renderer, scene) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, phi, theta);

    if (sky) {
        sky.material.uniforms['sunPosition'].value.copy(sun);
    }

    if (sunLight) {
        sunLight.position.copy(sun).multiplyScalar(100);
    }

    // Optional: Update scene environment for realistic reflections
    // This is expensive, so maybe do it only when needed or use PMREMGenerator
}