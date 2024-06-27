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
  loader.load('untitledcompressed.glb', function (gltf) {
      model = gltf.scene;
      model.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = new THREE.MeshPhysicalMaterial({
            metalness: 1,
            roughness: 0,
            side: THREE.DoubleSide
          })
        }
      });
      scene.add(model);
      resizeModel(); 
  }, undefined, function (error) {
      console.error(error);
  });
});

camera.position.z = 1.375;

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
    mouseY = (event.touches[0].clientY / window.innerHeight) * 2 + 1;
  } else {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 + 1;
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

// const mainCopy = document.querySelector('.main-copy');

// const observer = new IntersectionObserver((entries) => {
//   entries.forEach(entry => {
//     if (entry.isIntersecting) {
//       const clone = mainCopy.cloneNode(true);
//       document.querySelector(".main-wrapper").appendChild(clone);
//       observer.unobserve(mainCopy);
//       observer.observe(clone);
//     }
//   });
// }, { threshold: .6 });

// observer.observe(mainCopy);

(function() {
  const wrapper = document.getElementById("fold-effect");
  const btn = document.getElementById("btn-debug");

  const folds = Array.from(document.getElementsByClassName("fold"));

  const baseContent = document.getElementById("base-content");

  let state = {
    disposed: false,
    targetScroll: 0,
    scroll: 0
  };

  function lerp(current, target, speed = 0.1, limit = 0.001) {
    let change = (target - current) * speed;
    if (Math.abs(change) < limit) {
      change = target - current;
    }
    return change;
  }
  let scaleFix = 0.992;

  class FoldedDom {
    constructor(wrapper, folds = null, scrollers = null) {
      this.wrapper = wrapper;
      this.folds = folds;
      this.scrollers = [];
    }
    setContent(baseContent, createScrollers = true) {
      const folds = this.folds;
      if (!folds) return;

      let scrollers = [];

      for (let i = 0; i < folds.length; i++) {
        const fold = folds[i];
        const copyContent = baseContent.cloneNode(true);
        copyContent.id = "";
        let scroller;
        if (createScrollers) {
          let sizeFixEle = document.createElement("div");
          sizeFixEle.classList.add("fold-size-fix");
          // sizeFixEle.style.transform = `scaleY(${scaleFix})`;

          scroller = document.createElement("div");
          scroller.classList.add("fold-scroller");
          sizeFixEle.append(scroller);
          fold.append(sizeFixEle);
        } else {
          scroller = this.scrollers[i];
        }
        scroller.append(copyContent);

        scrollers[i] = scroller;
      }
      this.scrollers = scrollers;
    }
    updateStyles(scroll, skewAmp, rotationAmp) {
      const folds = this.folds;
      const scrollers = this.scrollers;

      for (let i = 0; i < folds.length; i++) {
        const scroller = scrollers[i];

        // Scroller fixed so its aligned
        // scroller.style.transform = `translateY(${100 * -i}%)`;
        // And the content is the one that scrolls
        scroller.children[0].style.transform = `translateY(${scroll}px)`;
      }
    }
  }

  let insideFold;

  const centerFold = folds[Math.floor(folds.length / 2)];
  let tick = () => {
    if (state.disposed) return;

    // Calculate the scroll based on how much the content is outside the centerFold
    document.body.style.height =
      insideFold.scrollers[0].children[0].clientHeight -
      centerFold.clientHeight +
      window.innerHeight +
      "px";

    state.targetScroll = -(
      document.documentElement.scrollTop || document.body.scrollTop
    );
    state.scroll += lerp(state.scroll, state.targetScroll, 0.1, 0.0001);

    insideFold.updateStyles(state.scroll);
    // setScrollStyles(state.currentY);

    requestAnimationFrame(tick);
  };
  
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }

  document.body.classList.remove('loading');
  insideFold = new FoldedDom(wrapper, folds);
  insideFold.setContent(baseContent);

  tick();

})();