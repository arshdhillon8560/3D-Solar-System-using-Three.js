// main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import starsTexture from './src/img/stars.jpg';
import sunTexture from './src/img/sun.jpg';
import mercuryTexture from './src/img/mercury.jpg';
import venusTexture from './src/img/venus.jpg';
import earthTexture from './src/img/earth.jpg';
import marsTexture from './src/img/mars.jpg';
import jupiterTexture from './src/img/jupiter.jpg';
import saturnTexture from './src/img/saturn.jpg';
import saturnRingTexture from './src/img/saturn ring.png';
import uranusTexture from './src/img/uranus.jpg';
import uranusRingTexture from './src/img/uranus ring.png';
import neptuneTexture from './src/img/neptune.jpg';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
const container = document.querySelector('.container');
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(-90, 140, 140);
orbit.update();

scene.add(new THREE.AmbientLight(0xffffff, 1));

function createOrbitPath(radius, color = 0xffffff, thickness = 1, opacity = 1) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, linewidth: thickness, opacity, transparent: opacity < 1 });
    const ellipse = new THREE.Line(geometry, material);
    ellipse.rotation.x = Math.PI / 2;
    return ellipse;
}

scene.add(
    createOrbitPath(28), createOrbitPath(44), createOrbitPath(62), createOrbitPath(78),
    createOrbitPath(100), createOrbitPath(138), createOrbitPath(176), createOrbitPath(200)
);

const gui = new dat.GUI();
const orbitFolder = gui.addFolder('Orbits');
const orbits = { all: true };
orbitFolder.add(orbits, 'all').name('Show orbits').onChange(v => {
    scene.children.forEach(c => c.type === 'Line' && (c.visible = v));
});
orbitFolder.open();

const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([starsTexture, starsTexture, starsTexture, starsTexture, starsTexture, starsTexture]);

const textureLoader = new THREE.TextureLoader();
const sunGeo = new THREE.SphereGeometry(16, 30, 30);
const sunMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(sunTexture) });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

function createLabel(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const context = canvas.getContext('2d');
    context.font = 'bold 48px Arial';
    context.fillStyle = 'white';
    context.fillText(name, 20, 80);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(25, 6, 1); sprite.position.y = 16;
    return sprite;
}

const planetInfo = {
    Mercury: {
        diameter: '4,879 km', orbit: '88 days', mass: '3.3 × 10^23 kg',
        distance: '57.9 million km', rotation: '58.6 days', gravity: '3.7 m/s²', temperature: '−173 to 427°C'
    },
    Venus: {
        diameter: '12,104 km', orbit: '225 days', mass: '4.87 × 10^24 kg',
        distance: '108.2 million km', rotation: '243 days', gravity: '8.87 m/s²', temperature: '471°C'
    },
    Earth: {
        diameter: '12,742 km', orbit: '365 days', mass: '5.97 × 10^24 kg',
        distance: '149.6 million km', rotation: '1 day', gravity: '9.8 m/s²', temperature: '−88 to 58°C'
    },
    Mars: {
        diameter: '6,779 km', orbit: '687 days', mass: '6.42 × 10^23 kg',
        distance: '227.9 million km', rotation: '1.03 days', gravity: '3.71 m/s²', temperature: '−87 to −5°C'
    },
    Jupiter: {
        diameter: '139,820 km', orbit: '12 years', mass: '1.90 × 10^27 kg',
        distance: '778.5 million km', rotation: '9.9 hours', gravity: '24.79 m/s²', temperature: '−108°C'
    },
    Saturn: {
        diameter: '116,460 km', orbit: '29 years', mass: '5.68 × 10^26 kg',
        distance: '1.43 billion km', rotation: '10.7 hours', gravity: '10.44 m/s²', temperature: '−139°C'
    },
    Uranus: {
        diameter: '50,724 km', orbit: '84 years', mass: '8.68 × 10^25 kg',
        distance: '2.87 billion km', rotation: '17.2 hours', gravity: '8.69 m/s²', temperature: '−195°C'
    },
    Neptune: {
        diameter: '49,244 km', orbit: '165 years', mass: '1.02 × 10^26 kg',
        distance: '4.5 billion km', rotation: '16.1 hours', gravity: '11.15 m/s²', temperature: '−200°C'
    }
};

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const planetMeshes = [];

function createPlanete(size, texture, position, ring, name) {
    const geo = new THREE.SphereGeometry(size, 30, 30);
    const mat = new THREE.MeshStandardMaterial({ map: textureLoader.load(texture) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    planetMeshes.push(mesh);

    const obj = new THREE.Object3D();
    obj.add(mesh);
    mesh.position.x = position;

    const label = createLabel(name);
    mesh.add(label);

    if (ring) {
        const ringGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            map: textureLoader.load(ring.texture),
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.x = position;
        ringMesh.rotation.x = -0.5 * Math.PI;
        obj.add(ringMesh);
    }

    scene.add(obj);
    return { mesh, obj };
}

const mercury = createPlanete(3.2, mercuryTexture, 28, null, 'Mercury');
const venus = createPlanete(5.8, venusTexture, 44, null, 'Venus');
const earth = createPlanete(6, earthTexture, 62, null, 'Earth');
const mars = createPlanete(4, marsTexture, 78, null, 'Mars');
const jupiter = createPlanete(12, jupiterTexture, 100, null, 'Jupiter');
const saturn = createPlanete(10, saturnTexture, 138, {
    innerRadius: 10, outerRadius: 20, texture: saturnRingTexture
}, 'Saturn');
const uranus = createPlanete(7, uranusTexture, 176, {
    innerRadius: 7, outerRadius: 12, texture: uranusRingTexture
}, 'Uranus');
const neptune = createPlanete(7, neptuneTexture, 200, null, 'Neptune');

scene.add(new THREE.PointLight(0xffffff, 2, 300));

function animate() {
    const n = 1;
    const m = 2;

    sun.rotateY(0.004 / n);
    mercury.mesh.rotateY(0.004 / n);
    venus.mesh.rotateY(0.002 / n);
    earth.mesh.rotateY(0.02 / n);
    mars.mesh.rotateY(0.018 / n);
    jupiter.mesh.rotateY(0.04 / n);
    saturn.mesh.rotateY(0.038 / n);
    uranus.mesh.rotateY(0.03 / n);
    neptune.mesh.rotateY(0.032 / n);

    mercury.obj.rotateY(0.04 / m);
    venus.obj.rotateY(0.015 / m);
    earth.obj.rotateY(0.01 / m);
    mars.obj.rotateY(0.008 / m);
    jupiter.obj.rotateY(0.002 / m);
    saturn.obj.rotateY(0.0009 / m);
    uranus.obj.rotateY(0.0004 / m);
    neptune.obj.rotateY(0.0001 / m);

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);
    if (intersects.length > 0) {
        const planet = intersects[0].object.name;
        const info = planetInfo[planet];
        document.getElementById('info-card').innerHTML = `
            <h2>${planet}</h2>
            <p><strong>Diameter:</strong> ${info.diameter}</p>
            <p><strong>Orbit Period:</strong> ${info.orbit}</p>
            <p><strong>Mass:</strong> ${info.mass}</p>
            <p><strong>Mean Distance from Sun:</strong> ${info.distance}</p>
            <p><strong>Rotation Period:</strong> ${info.rotation}</p>
            <p><strong>Surface Gravity:</strong> ${info.gravity}</p>
            <p><strong>Surface Temperature:</strong> ${info.temperature}</p>
        `;
    }
});
