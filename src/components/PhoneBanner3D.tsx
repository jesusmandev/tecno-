"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

interface PhoneBanner3DProps {
  className?: string;
}

const MODELS_CONFIG = [
  {
    name: "iPhone 17 Pro Max",
    tag: "Titanio",
    url: "/phoneglb/apple_iphone_17_pro_max-v1.glb",
    targetScale: 1.95,
  },
  {
    name: "iPhone Duo Fold 2026",
    tag: "Star White",
    url: "/phoneglb/apple_iphone_duo_fold_star_white_2026_animated-v1.glb",
    targetScale: 1.85,
  },
  {
    name: "iPhone 18 Pro Max",
    tag: "Next-Gen 2026",
    url: "/phoneglb/phone18-v1.glb",
    targetScale: 1.95,
  },
];

export default function PhoneBanner3D({ className = "" }: PhoneBanner3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [activeModelIndex, setActiveModelIndex] = useState(0);

  const currentModelRef = useRef(0);
  const switchModelRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isDisposed = false;
    let lastTime = performance.now();

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf0f4f8, 1.8);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    const redAccentLight = new THREE.PointLight(0xe02424, 2.2, 10);
    redAccentLight.position.set(2, -2, 1);
    scene.add(redAccentLight);

    // 4. Model Slots (Pivots & Mixers)
    interface ModelSlot {
      pivot: THREE.Group;
      mixer: THREE.AnimationMixer | null;
      loaded: boolean;
    }

    const slots: ModelSlot[] = MODELS_CONFIG.map((_, i) => {
      const pivot = new THREE.Group();
      pivot.position.x = i === 0 ? 0 : 4.5;
      pivot.visible = i === 0;
      pivot.rotation.x = 0.12;
      pivot.rotation.z = -0.04;
      scene.add(pivot);
      return {
        pivot,
        mixer: null,
        loaded: false,
      };
    });

    (window as unknown as Record<string, unknown>).__PHONE3D_DEBUG = { scene, camera, slots, MODELS_CONFIG };

    // 5. Loaders Setup (Draco WASM)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/gltf/");

    // Helper to process loaded model
    const setupModelInSlot = (gltf: GLTF, idx: number, cfg: (typeof MODELS_CONFIG)[0]) => {
      if (isDisposed) return;
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      const scale = cfg.targetScale / (maxDim || 1);
      model.scale.set(scale, scale, scale);
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((mat: THREE.Material) => {
              if ("envMapIntensity" in mat) {
                (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.25;
              }
              mat.needsUpdate = true;
            });
          }
        }
      });

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopPingPong, Infinity);
        action.play();
        slots[idx].mixer = mixer;
      }

      slots[idx].pivot.add(model);
      slots[idx].loaded = true;

      // As soon as the first or active model loads, remove loading spinner
      if (idx === 0 || idx === currentModelRef.current) {
        setLoading(false);
      }
    };

    // Load all models in parallel - Draco worker pool handles them concurrently
    MODELS_CONFIG.forEach((cfg, idx) => {
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        cfg.url,
        (gltf) => {
          setupModelInSlot(gltf, idx, cfg);
        },
        undefined,
        (err) => {
          console.warn(`Local Draco load failed for ${cfg.name}, trying CDN...`, err);
          const fallbackDraco = new DRACOLoader();
          fallbackDraco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
          const fallbackGltf = new GLTFLoader();
          fallbackGltf.setDRACOLoader(fallbackDraco);
          fallbackGltf.load(
            cfg.url,
            (gltf) => {
              setupModelInSlot(gltf, idx, cfg);
            },
            undefined,
            (finalErr) => {
              console.error(`Failed to load ${cfg.name}:`, finalErr);
              slots[idx].loaded = true;
            }
          );
        }
      );
    });

    // 6. Carousel Transition State Machine
    let transitionProgress = 1;
    let isTransitioning = false;
    let outgoingIndex = 0;
    let incomingIndex = 0;

    const startTransition = (toIndex: number) => {
      if (toIndex === currentModelRef.current) return;

      // If a transition is already animating, immediately finalize it
      if (isTransitioning) {
        slots[incomingIndex].pivot.position.x = 0;
        slots[incomingIndex].pivot.scale.set(1, 1, 1);
        slots[outgoingIndex].pivot.position.x = -4.0;
        slots[outgoingIndex].pivot.visible = false;
      }

      isTransitioning = true;
      transitionProgress = 0;
      outgoingIndex = currentModelRef.current;
      incomingIndex = toIndex;
      currentModelRef.current = toIndex;
      setActiveModelIndex(toIndex);

      // Prepare incoming slot: place it on the right side
      slots[incomingIndex].pivot.position.x = 4.0;
      slots[incomingIndex].pivot.scale.set(0.75, 0.75, 0.75);
      slots[incomingIndex].pivot.visible = true;
    };

    let intervalId: NodeJS.Timeout;

    const resetInterval = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const nextIndex = (currentModelRef.current + 1) % MODELS_CONFIG.length;
        startTransition(nextIndex);
      }, 8000);
    };

    switchModelRef.current = (toIndex: number) => {
      startTransition(toIndex);
      resetInterval();
    };

    // Auto-advance carousel every 8.0 seconds
    resetInterval();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // 7. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update mixers for animated models
      slots.forEach((slot) => {
        if (slot.mixer) {
          slot.mixer.update(delta);
        }
      });

      // Handle Carousel Transition
      if (isTransitioning) {
        transitionProgress += delta * 1.1;

        if (transitionProgress >= 1) {
          transitionProgress = 1;
          isTransitioning = false;

          // Finalize positions
          slots[incomingIndex].pivot.position.x = 0;
          slots[incomingIndex].pivot.scale.set(1, 1, 1);

          slots[outgoingIndex].pivot.position.x = -4.0;
          slots[outgoingIndex].pivot.visible = false;
        } else {
          const eased = easeInOutCubic(transitionProgress);

          // Outgoing: slides from 0 to -4.0
          slots[outgoingIndex].pivot.position.x = THREE.MathUtils.lerp(0, -4.0, eased);
          const outScale = THREE.MathUtils.lerp(1, 0.75, eased);
          slots[outgoingIndex].pivot.scale.set(outScale, outScale, outScale);

          // Incoming: slides from +4.0 to 0
          slots[incomingIndex].pivot.position.x = THREE.MathUtils.lerp(4.0, 0, eased);
          const inScale = THREE.MathUtils.lerp(0.75, 1, eased);
          slots[incomingIndex].pivot.scale.set(inScale, inScale, inScale);
        }
      }

      // Continuous rotation on its own axis
      slots.forEach((slot, i) => {
        if (slot.pivot.visible || i === currentModelRef.current) {
          slot.pivot.rotation.y += 0.009;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. Cleanup
    return () => {
      isDisposed = true;
      clearInterval(intervalId);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dracoLoader.dispose();

      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m: THREE.Material) => m.dispose());
          } else if (object.material) {
            (object.material as THREE.Material).dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center select-none"
      />

      {/* Loading state indicator */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50 text-xs bg-[#111111]/40 backdrop-blur-xs">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-[var(--red)]" />
          <span className="font-mono tracking-wider text-[11px]">Cargando 3D...</span>
        </div>
      )}

      {/* Carousel Navigation Indicators & Model Name Badge */}
      {!loading && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 transition-all">
          {MODELS_CONFIG.map((cfg, idx) => (
            <button
              key={cfg.name}
              onClick={() => switchModelRef.current(idx)}
              className="flex items-center gap-1.5 focus:outline-hidden group cursor-pointer"
              title={cfg.name}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeModelIndex === idx
                    ? "w-6 bg-[var(--red)] shadow-xs shadow-red-500/50"
                    : "w-2 bg-white/30 group-hover:bg-white/60"
                }`}
              />
              {activeModelIndex === idx && (
                <span className="text-[10px] font-semibold text-white/90 tracking-wide select-none animate-fadeIn">
                  {cfg.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
