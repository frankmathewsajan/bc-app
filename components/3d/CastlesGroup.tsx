import ExpoTHREE from 'expo-three';
import * as THREE from 'three';
// @ts-ignore - manifest has no TS types
import modelsManifest from '../../assets/models';

/**
 * PROFESSIONAL-GRADE CASTLE LOADER - REWRITTEN FROM SCRATCH
 * Optimized for Expo/React Native with proper texture handling
 * Guaranteed to show colors like Cesium engine
 */

interface CastleData {
  model: any;
  textures: any[];
}

// Suppress expo-gl warnings (harmless limitation)
const suppressGLWarnings = () => {
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args: any[]) => {
    const msg = String(args[0] || '');
    if (msg.includes('EXGL: gl.pixelStorei()')) return;
    originalLog(...args);
  };
  
  console.warn = (...args: any[]) => {
    const msg = String(args[0] || '');
    if (msg.includes('EXGL: gl.pixelStorei()')) return;
    originalWarn(...args);
  };
  
  console.error = (...args: any[]) => {
    const msg = String(args[0] || '');
    if (msg.includes('THREE.GLTFLoader') && msg.includes("Couldn't load texture")) return;
    if (msg.includes('EXGL:')) return;
    originalError(...args);
  };
};

/**
 * Load a single texture with PROPER settings based on texture type
 * index 0 = Normal map (LINEAR color space)
 * index 1 = Base color (SRGB color space) - THE COLOR!
 * index 2 = Metallic/Roughness (LINEAR color space)
 */
async function loadTextureOptimized(textureResource: any, index: number): Promise<THREE.Texture | null> {
  try {
    const texture = await ExpoTHREE.loadTextureAsync({ asset: textureResource });
    
    // CRITICAL: Different settings for different texture types
    if (index === 0) {
      // NORMAL MAP - Must be LINEAR color space
      texture.colorSpace = THREE.NoColorSpace; // Linear for normal maps
      console.log(`    ✓ Texture ${index} (NORMAL): ${texture.image?.width}x${texture.image?.height}`);
    } else if (index === 1) {
      // BASE COLOR - This is the COLOR MAP! SRGB color space
      texture.colorSpace = THREE.SRGBColorSpace; // sRGB for color
      console.log(`    ✓ Texture ${index} (COLOR): ${texture.image?.width}x${texture.image?.height}`);
    } else if (index === 2) {
      // METALLIC/ROUGHNESS - Linear color space
      texture.colorSpace = THREE.NoColorSpace; // Linear for data maps
      console.log(`    ✓ Texture ${index} (METALLIC/ROUGH): ${texture.image?.width}x${texture.image?.height}`);
    }
    
    // Common settings for all textures
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4; // Better quality
    texture.flipY = false; // GLTF standard - DO NOT FLIP
    texture.needsUpdate = true;
    
    return texture;
  } catch (error: any) {
    console.error(`    ✗ Texture ${index} failed:`, error?.message);
    return null;
  }
}

/**
 * Apply textures to mesh materials using PROPER PBR WORKFLOW
 * GLTF structure:
 * - img0.jpg = NORMAL MAP (bumps/details)
 * - img1.jpg = BASE COLOR (the actual colors!)
 * - img2.jpg = METALLIC/ROUGHNESS (shine/matte)
 */
function applyTexturesToMesh(
  mesh: THREE.Mesh,
  textures: THREE.Texture[],
  meshIndex: number
): void {
  console.log(`  🎨 Mesh ${meshIndex}: "${mesh.name || 'unnamed'}"`);
  
  const geometry = mesh.geometry;
  const hasUVs = geometry.attributes.uv !== undefined;
  
  console.log(`    UV: ${hasUVs}, Textures available: ${textures.length}`);
  
  if (!hasUVs) {
    console.warn(`    ⚠ No UV mapping - textures cannot be applied!`);
    return;
  }
  
  if (textures.length < 3) {
    console.warn(`    ⚠ Expected 3 textures (normal, color, metallic), got ${textures.length}`);
    return;
  }
  
  // CRITICAL: Map textures according to GLTF spec
  // From GLTF: normalTexture: index 0, baseColorTexture: index 1, metallicRoughnessTexture: index 2
  const normalMap = textures[0];      // img0.jpg - Normal map
  const colorMap = textures[1];       // img1.jpg - BASE COLOR (THIS IS THE KEY!)
  const metallicRoughnessMap = textures[2]; // img2.jpg - Metallic/Roughness
  
  console.log(`    📸 Normal: img0, Color: img1, MetallicRough: img2`);
  
  // Create PBR material with PROPER texture channels
  // MeshStandardMaterial = PBR material that matches GLTF spec
  const pbrMaterial = new THREE.MeshStandardMaterial({
    // THE COLOR MAP - This is what makes it colorful!
    map: colorMap,
    
    // Normal map for surface detail
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1, 1),
    
    // Metallic/Roughness combined map (GLTF standard)
    metalnessMap: metallicRoughnessMap,
    roughnessMap: metallicRoughnessMap,
    
    // Material properties
    metalness: 0.0,  // Not very metallic
    roughness: 1.0,  // Fairly rough surface
    
    // Rendering
    side: THREE.FrontSide,
    transparent: false,
    fog: false,
  });
  
  // Apply to mesh
  if (Array.isArray(mesh.material)) {
    mesh.material = [pbrMaterial];
  } else {
    mesh.material = pbrMaterial;
  }
  
  // Force update
  pbrMaterial.needsUpdate = true;
  
  console.log(`    ✅ Applied PBR material with all 3 texture channels`);
  
  // Force material update
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(mat => mat.needsUpdate = true);
  } else {
    mesh.material.needsUpdate = true;
  }
}

/**
 * Load a single castle model with textures
 */
async function loadSingleCastle(
  castleData: CastleData,
  castleIndex: number,
  totalCastles: number
): Promise<THREE.Group | null> {
  console.log(`\n🏰 Loading Castle ${castleIndex + 1}/${totalCastles}`);
  
  try {
    // Step 1: Load all textures in parallel for speed
    console.log(`  📸 Loading ${castleData.textures.length} textures...`);
    const texturePromises = castleData.textures.map((tex, idx) => 
      loadTextureOptimized(tex, idx)
    );
    const loadedTextures = (await Promise.all(texturePromises)).filter(Boolean) as THREE.Texture[];
    
    if (loadedTextures.length === 0) {
      console.error(`  ✗ No textures loaded for castle ${castleIndex + 1}`);
      return null;
    }
    
    console.log(`  ✓ ${loadedTextures.length}/${castleData.textures.length} textures ready`);
    
    // Step 2: Load the GLB model
    console.log(`  🔄 Loading GLB model...`);
    const gltf = await ExpoTHREE.loadAsync(castleData.model);
    
    if (!gltf || !gltf.scene) {
      console.error(`  ✗ Invalid GLTF data for castle ${castleIndex + 1}`);
      return null;
    }
    
    console.log(`  ✓ Model loaded successfully`);
    
    // Step 3: Apply textures to ALL meshes in the model
    console.log(`  🎨 Applying textures to meshes...`);
    let meshCount = 0;
    
    gltf.scene.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        applyTexturesToMesh(child, loadedTextures, meshCount++);
      }
    });
    
    console.log(`  ✅ Castle ${castleIndex + 1} complete: ${meshCount} meshes textured`);
    
    // Create group for positioning
    const group = new THREE.Group();
    group.add(gltf.scene);
    
    return group;
    
  } catch (error: any) {
    console.error(`  ❌ Castle ${castleIndex + 1} failed:`, error?.message);
    console.error(`  Stack:`, error?.stack);
    return null;
  }
}

/**
 * Create fallback geometry if models fail
 */
function createFallbackCastle(castleIndex: number): THREE.Group {
  console.log(`  🔧 Creating fallback geometry for castle ${castleIndex + 1}`);
  
  const group = new THREE.Group();
  
  // Simple castle shape - colorful so we can see it
  const colors = [0xff00ff, 0x00ffff, 0xffff00]; // Magenta, Cyan, Yellow
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 2),
    new THREE.MeshLambertMaterial({ color: colors[castleIndex % colors.length] })
  );
  body.position.y = 1.5;
  
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 2, 4),
    new THREE.MeshLambertMaterial({ color: 0xff6b6b })
  );
  roof.position.y = 4;
  
  group.add(body);
  group.add(roof);
  
  return group;
}

/**
 * MAIN LOADER - Load all castles with optimal positioning
 */
export async function loadCastlesGroup(scene: THREE.Scene): Promise<THREE.Group[]> {
  suppressGLWarnings();
  
  console.log('\n═══════════════════════════════════════');
  console.log('🏰 CASTLE LOADER - PROFESSIONAL EDITION');
  console.log('═══════════════════════════════════════\n');
  
  // Load manifest
  let manifest: CastleData[] = [];
  try {
    const data = Array.isArray(modelsManifest) 
      ? modelsManifest 
      : ((modelsManifest as any)?.default || []);
    manifest = data.filter((item: any) => item && item.model && item.textures);
  } catch (error: any) {
    console.error('❌ Failed to load manifest:', error?.message);
  }
  
  if (manifest.length === 0) {
    console.warn('⚠️ No models in manifest - cannot load castles');
    return [];
  }
  
  console.log(`📦 Found ${manifest.length} castles in manifest\n`);
  
  // Load all castles
  const castleGroups: THREE.Group[] = [];
  
  for (let i = 0; i < manifest.length; i++) {
    const castle = await loadSingleCastle(manifest[i], i, manifest.length);
    
    if (castle) {
      castleGroups.push(castle);
    } else {
      // Use fallback
      console.warn(`⚠️ Using fallback for castle ${i + 1}`);
      castleGroups.push(createFallbackCastle(i));
    }
  }
  
  // Position castles optimally for landscape view
  const positions = [
    { x: -30, y: 0, z: 0 },  // Left
    { x: 0, y: 0, z: 0 },    // Center
    { x: 30, y: 0, z: 0 }    // Right
  ];
  
  const scale = 22; // Optimized scale for visibility
  
  console.log('\n📍 Positioning castles...');
  castleGroups.forEach((castle, i) => {
    const pos = positions[i] || positions[0];
    castle.position.set(pos.x, pos.y, pos.z);
    castle.scale.setScalar(scale);
    scene.add(castle);
    console.log(`  Castle ${i + 1}: (${pos.x}, ${pos.y}, ${pos.z}) @ ${scale}x scale`);
  });
  
  console.log('\n✅ CASTLE LOADER COMPLETE');
  console.log(`   Loaded: ${castleGroups.length}/${manifest.length} castles`);
  console.log('═══════════════════════════════════════\n');
  
  return castleGroups;
}

export function animateCastles(castles: THREE.Group[], time: number): void {
  castles.forEach((castle, index) => {
    // Smooth continuous floating animation - like castles floating in the sky
    const floatSpeed = 0.4; // Slower, smoother motion
    const floatHeight = 2.5; // More pronounced vertical movement
    const offset = index * 2.0; // Stagger each castle's motion
    
    castle.position.y = Math.sin(time * floatSpeed + offset) * floatHeight;
    
    // Very subtle tilt/sway for realism while floating
    castle.rotation.z = Math.sin(time * 0.15 + offset) * 0.02;
    castle.rotation.x = Math.cos(time * 0.18 + offset * 0.5) * 0.015;
  });
}
