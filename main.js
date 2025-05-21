import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";

let cursor = document.querySelector('.cursor');
let cursorLink = document.querySelector('.cursor-link');

function cursorPosition(cursorElement, xPosSubstractValue, yPosSubstractValue) {
  document.addEventListener('mousemove', (e) => {
    if (cursorElement.style.display != "none") {
      cursorElement.style.left = e.clientX - xPosSubstractValue + 'px';
      cursorElement.style.top = e.clientY - yPosSubstractValue + 'px';
    }
  });
}

cursorPosition(cursor, 3.5, 3.5);
cursorPosition(cursorLink, 14.5, 3.5);

cursorLink.style.display = "none";

document.querySelectorAll("body, body a").forEach((el) => {
  el.style.cursor = "url('bitmap.png'), auto";
});

function handleFirstMouseMove(e) {
  document.querySelectorAll("body, body a").forEach((el) => {
    el.style.cursor = "none";
  });

  document.removeEventListener("mousemove", handleFirstMouseMove);
}
document.addEventListener("mousemove", handleFirstMouseMove);

document.addEventListener("mouseover", (e) => {
  if (e.target.closest("a")) {
    cursor.style.display = "none";
    cursorLink.style.display = "block";
  } else {
    cursor.style.display = "block";
    cursorLink.style.display = "none";
  }
});

document.addEventListener("mouseleave", () => {
  cursor.style.display = "none";
  cursorLink.style.display = "none";
});

const container = document.getElementById("threejs-container");

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const effect = new AsciiEffect(renderer, ' .:-+.#&@ ', { invert: true, resolution: .1 });
effect.setSize(window.innerWidth, window.innerHeight);
effect.domElement.style.color = '#000';

container.appendChild(effect.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

let model;

const loader = new GLTFLoader();
loader.load(
  "naiden.glb",
  (gltf) => {
    model = gltf.scene;
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    frameArea(boxSize * 0.5, boxSize, boxCenter, camera);
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
  const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = (halfSizeToFitOnScreen / Math.tan(halfFovY)) * 0.9;

  const direction = new THREE.Vector3()
    .subVectors(camera.position, boxCenter)
    .multiply(new THREE.Vector3(1, 0, 1))
    .normalize();

  camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
});

let targetRotation = new THREE.Vector2();
let currentRotation = new THREE.Vector2();

function rotateModelOnMove(event) {
  let clientX = event.touches ? event.touches[0].clientX : event.clientX;
  let clientY = event.touches ? event.touches[0].clientY : event.clientY;

  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;

  targetRotation.x = ((clientY - halfHeight) / halfHeight) * Math.PI;
  targetRotation.y = ((clientX - halfWidth) / halfWidth) * Math.PI;
}

document.body.addEventListener("mousemove", rotateModelOnMove);
document.body.addEventListener("touchmove", rotateModelOnMove);

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    currentRotation.x = THREE.MathUtils.lerp(
      currentRotation.x,
      targetRotation.x,
      0.1
    );
    currentRotation.y = THREE.MathUtils.lerp(
      currentRotation.y,
      targetRotation.y,
      0.1
    );

    model.rotation.x = currentRotation.x;
    model.rotation.y = currentRotation.y;
  }

  effect.render(scene, camera);
}
animate();
