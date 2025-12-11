import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; // Atau HDRLoader jika sudah update

export function setupLighting(scene) {
    // 1. HDRI / Sky
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
    sunLight.shadow.mapSize.width = 4096; 
    sunLight.shadow.mapSize.height = 4096;
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
}