import ExpoTHREE from 'expo-three';
import * as THREE from 'three';
// Import models manifest (default exports an array). The manifest file is safe to import
// and will be created (exports an empty array by default).
// @ts-ignore - manifest has no TS types
import modelsManifest from '../../assets/models';

/**
 * Attempts to load .glb models declared in `assets/models/index.ts` manifest.
 * If the manifest is empty or loading fails, falls back to procedural geometry.
 * Returns an array of THREE.Group added to the provided scene.
 */
export async function loadCastlesGroup(scene: THREE.Scene): Promise<THREE.Group[]> {
  const castles: THREE.Group[] = [];

  // Suppress expo-gl pixelStorei warnings (known limitation)
  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    const msg = args[0]?.toString() || '';
    if (msg.includes('EXGL: gl.pixelStorei()')) {
      // Suppress pixelStorei warnings - known expo-gl limitation
      return;
    }
    originalConsoleLog(...args);
  };

  // Try loading manifest (safe import - manifest exists and exports an array)
  let manifest: (number | string)[] = [];
  // The project contains a small manifest at `assets/models/index.ts` which should export
  // a default array of statically required model modules, e.g.:
  // export default [require('./castle-center.glb'), require('./castle-left.glb')]
  // This keeps Metro bundler happy because requires are static. If you want to enable GLB
  // loading, update that manifest to list your .glb files. The default manifest is an
  // empty array so it is safe when no models are present.
  try {
    // Read the statically imported manifest. This will be an empty array by default
    // (see assets/models/index.ts) and won't cause Metro bundler errors.
    manifest = Array.isArray(modelsManifest) ? (modelsManifest as any) : ((modelsManifest as any)?.default || []);
  } catch {
    manifest = [];
  }

  if (manifest && manifest.length > 0) {
    // Load each model using expo-three (React Native compatible)
    // Models are uncompressed GLB files with separate texture files
    for (let i = 0; i < manifest.length; i++) {
      const modelData = manifest[i] as any; // Type assertion for dynamic model data
      try {
        console.log(`🔄 Loading uncompressed GLB castle model ${i + 1}/${manifest.length}...`);
        
        // Get model resource and textures
        let modelResource;
        let textureResources: any[] = [];
        
        if (typeof modelData === 'object' && modelData.model) {
          // New manifest format with model + textures
          modelResource = modelData.model;
          textureResources = modelData.textures || [];
        } else {
          // Old format - direct model reference (no textures)
          modelResource = modelData;
        }
        
        // Load textures first using expo-three's texture loader
        const loadedTextures: THREE.Texture[] = [];
        if (textureResources.length > 0) {
          console.log(`📸 Loading ${textureResources.length} textures for castle ${i + 1}...`);
          for (const textureRes of textureResources) {
            try {
              const texture = await ExpoTHREE.loadTextureAsync({ asset: textureRes });
              texture.needsUpdate = true;
              loadedTextures.push(texture);
            } catch (texError: any) {
              console.warn(`⚠️ Failed to load texture:`, texError?.message);
            }
          }
          console.log(`✅ Loaded ${loadedTextures.length}/${textureResources.length} textures`);
        }
        
        // Suppress THREE.GLTFLoader texture errors (we load textures separately)
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          const msg = args[0]?.toString() || '';
          if (msg.includes('THREE.GLTFLoader') && msg.includes("Couldn't load texture")) {
            // Suppress GLB embedded texture errors - we're loading textures separately
            return;
          }
          originalConsoleError(...args);
        };
        
        // Use expo-three which handles React Native specifics
        // This should work with uncompressed GLB files
        const model = await ExpoTHREE.loadAsync(modelResource);
        
        // Restore console.error
        console.error = originalConsoleError;

        console.log(`✅ Model loaded successfully, adding to scene...`);

        const group = new THREE.Group();
        
        // Handle different model formats
        if (model.scene) {
          // GLTF format with scene
          group.add(model.scene);
          
          // Apply loaded textures to materials - FORCE texture application
          if (loadedTextures.length > 0) {
            console.log(`🎨 Applying ${loadedTextures.length} textures to model meshes...`);
            let meshCount = 0;
            
            model.scene.traverse((child: any) => {
              if (child.isMesh) {
                meshCount++;
                console.log(`  Found mesh ${meshCount}: ${child.name || 'unnamed'}`);
                
                // Check if geometry has vertex colors
                const hasVertexColors = child.geometry?.attributes?.color !== undefined;
                console.log(`    Mesh has vertex colors: ${hasVertexColors}`);
                
                // Get all materials
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((mat: any, matIndex: number) => {
                  if (mat) {
                    console.log(`    Material ${matIndex} type: ${mat.type}, has map: ${!!mat.map}, color: ${mat.color?.getHexString()}`);
                    
                    // DON'T override existing textures! Only add if missing
                    if (!mat.map && loadedTextures.length > 0) {
                      const texture = loadedTextures[0];
                      texture.flipY = false;
                      texture.colorSpace = THREE.SRGBColorSpace;
                      texture.needsUpdate = true;
                      mat.map = texture;
                      console.log(`    ✓ Applied external texture to material ${matIndex}`);
                    } else if (mat.map) {
                      // Material already has a texture - just refresh it
                      mat.map.colorSpace = THREE.SRGBColorSpace;
                      mat.map.needsUpdate = true;
                      console.log(`    ✓ Refreshed existing texture on material ${matIndex}`);
                    }
                    
                    // CRITICAL: Don't override the color! Keep original colors
                    // Only ensure it's not pure black
                    if (mat.color && mat.color.getHex() === 0x000000) {
                      mat.color.setHex(0xffffff);
                      console.log(`    ⚠️ Fixed black color on material ${matIndex}`);
                    }
                    
                    // Disable emissive darkness
                    if (mat.emissive) {
                      mat.emissive.setHex(0x000000);
                    }
                    mat.emissiveIntensity = 0;
                    
                    // Enable vertex colors if present
                    mat.vertexColors = hasVertexColors;
                    
                    // Better PBR settings for Standard/Physical materials
                    if (mat.metalness !== undefined) {
                      mat.metalness = 0.2;
                      mat.roughness = 0.8;
                    }
                    
                    // Force material update
                    mat.needsUpdate = true;
                  }
                });
              }
            });
            
            console.log(`✅ Applied textures to ${meshCount} meshes in castle ${i + 1}`);
          }
        } else if (model) {
          // Direct mesh or group
          group.add(model);
        }

        // Position castles - spread horizontally, LOWER vertically for proper centering
        // In landscape, screen center is around y=-5 to y=-10 in world space
        const positions = [
          { x: -25, y: -8, z: 0 },   // Left castle - moved DOWN
          { x: 0, y: -8, z: 0 },     // Center castle - moved DOWN
          { x: 25, y: -8, z: 0 }     // Right castle - moved DOWN
        ];
        
        const pos = positions[i] || { x: (i - (manifest.length - 1) / 2) * 25, y: -8, z: 0 };
        group.position.set(pos.x, pos.y, pos.z);
        group.scale.setScalar(18);  // Reasonable size - not too big
        scene.add(group);
        castles.push(group);
        
        console.log(`✅ Castle ${i + 1} positioned at (${pos.x}, ${pos.y}, ${pos.z}) with 18x scale`);
      } catch (error: any) {
        // If one model fails, log and continue to next
        console.error(`❌ Failed loading model at index ${i}:`, error?.message || error);
        console.error('Stack:', error?.stack);
        
        // Try creating a simple placeholder cube for failed models
        console.log(`⚠️ Creating placeholder cube for castle ${i + 1}`);
        const placeholder = new THREE.Mesh(
          new THREE.BoxGeometry(2, 3, 2),
          new THREE.MeshPhongMaterial({ color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.2 })
        );
        const group = new THREE.Group();
        group.add(placeholder);
        const positions = [
          { x: -25, y: -8, z: 0 },
          { x: 0, y: -8, z: 0 },
          { x: 25, y: -8, z: 0 }
        ];
        const pos = positions[i] || { x: (i - (manifest.length - 1) / 2) * 25, y: -8, z: 0 };
        group.position.set(pos.x, pos.y, pos.z);
        group.scale.setScalar(18);
        scene.add(group);
        castles.push(group);
      }
    }

    if (castles.length > 0) {
      console.log(`✅ Loaded ${castles.length} GLB castle(s) from manifest`);
      // Restore console.log
      console.log = originalConsoleLog;
      return castles;
    } else {
      console.warn('⚠️ No GLB castle models were loaded from manifest');
    }
  } else {
    console.warn('⚠️ Model manifest is empty - no castle models will be loaded');
  }

  // Restore console.log before returning
  console.log = originalConsoleLog;
  return castles;
}

export function animateCastles(castles: THREE.Group[], time: number): void {
  castles.forEach((castle, index) => {
    castle.rotation.y += 0.003 + index * 0.001;
    // Gentler floating animation centered at y=0
    castle.position.y = Math.sin(time * 0.5 + index * 0.8) * 0.5;
    castle.rotation.z = Math.sin(time * 0.3 + index) * 0.02;
  });
}
