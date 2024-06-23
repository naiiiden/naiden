import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

console.log(GLTFLoader);

// const lenis = new Lenis();

// function raf(time) {
//   lenis.raf(time);
//   requestAnimationFrame(raf);
// }

// requestAnimationFrame(raf);

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  time.textContent = `${hours}:${minutes}:${seconds}`;
};

updateClock();

// Update the clock every second
setInterval(updateClock, 1000);

const container = document.getElementById('threejs-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;  // Enable shadow maps
container.appendChild(renderer.domElement);

// Add a point light
const pointLight = new THREE.PointLight(0xffffff, 1);  // Increased intensity
pointLight.position.set(10, 10, 0);
pointLight.castShadow = true;  // Enable shadows
scene.add(pointLight);

let model;
const loader = new GLTFLoader();
loader.load('untitled.glb', function (gltf) {
    model = gltf.scene;
    model.traverse(function (node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    scene.add(model);
    resizeModel(); 
}, undefined, function (error) {
    console.error(error);
});

camera.position.z = 2;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeModel();
});

function resizeModel() {
  if (model) {
    const scale = Math.min(window.innerWidth / 1000, window.innerHeight / 1000);
    model.scale.set(scale, scale, scale);
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();