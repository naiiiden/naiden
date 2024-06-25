import Lenis from "lenis";
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from "three/examples/jsm/Addons.js";

const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  time.textContent = `${hours}:${minutes}:${seconds}`;
};

updateClock();

setInterval(updateClock, 1000);

const container = document.getElementById('threejs-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

let model;
new RGBELoader().load('texture.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  
  const loader = new GLTFLoader();
  loader.load('untitled.glb', function (gltf) {
      model = gltf.scene;
      model.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = new THREE.MeshPhysicalMaterial({
            metalness: 1,
            roughness: 0,
          })
        }
      });
      scene.add(model);
      resizeModel(); 
  }, undefined, function (error) {
      console.error(error);
  });
});

camera.position.z = 1.5;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    console.log(camera.aspect);
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

let mouseX, mouseY;

function rotateModelOnMove(event) {
  if (event.touches) {
    mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
  } else {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  if (model) {
    model.rotation.x = mouseY * Math.PI / 1;
    model.rotation.y = mouseX * Math.PI / 1;
  }
}

window.addEventListener('touchmove', rotateModelOnMove);
window.addEventListener('mousemove', rotateModelOnMove);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();