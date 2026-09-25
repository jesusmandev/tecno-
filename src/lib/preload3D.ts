export const ASSETS_3D = [
  "/draco/gltf/draco_decoder.wasm",
  "/draco/gltf/draco_wasm_wrapper.js",
  "/draco/gltf/draco_decoder.js",
  "/phoneglb/apple_iphone_17_pro_max-v1.glb",
  "/phoneglb/apple_iphone_duo_fold_star_white_2026_animated-v1.glb",
  "/phoneglb/phone18-v1.glb",
];

let preloaded = false;

export function preload3DModels(priority: "low" | "high" = "low") {
  if (typeof window === "undefined" || preloaded) return;
  preloaded = true;

  ASSETS_3D.forEach((url) => {
    fetch(url, {
      cache: "force-cache",
      priority,
    }).catch(() => {
      // Ignore background prefetch errors
    });
  });
}
