import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as THREE from 'three';
import { animateCastles, loadCastlesGroup } from './CastlesGroup';

const LOADING_MESSAGES = [
  'Summoning magical realms...',
  'Crafting floating castles...',
  'Painting enchanted textures...',
  'Weaving cosmic threads...',
  'Channeling mystical energies...',
];

// Camera control limits - STRICTER LIMITS
const CAMERA_MIN_DISTANCE = 35;  // Can't zoom in too much
const CAMERA_MAX_DISTANCE = 80;  // Can't zoom out too much
const CAMERA_DEFAULT_DISTANCE = 50;
const CAMERA_DEFAULT_ROTATION = { x: 0, y: 0 };

export default function ModelScene() {
  const { width, height } = useWindowDimensions();
  const mountedRef = useRef(true);
  const animationRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  
  // Camera state - GAME-LIKE CONTROLS
  const cameraDistanceRef = useRef(CAMERA_DEFAULT_DISTANCE);
  const cameraRotationRef = useRef({ x: 0, y: 0 });
  const targetCameraDistanceRef = useRef(CAMERA_DEFAULT_DISTANCE);
  const targetCameraRotationRef = useRef({ x: 0, y: 0 });
  
  // Touch state
  const touchStartDistanceRef = useRef(0);
  
  // Selected castle for individual rotation
  const selectedCastleRef = useRef<number>(-1);
  const castleRotationsRef = useRef<number[]>([0, 0, 0]);
  
  // DEBUG & ANIMATION STATE - OPTIMIZED
  const [debugInfo, setDebugInfo] = useState({
    cameraDistance: CAMERA_DEFAULT_DISTANCE,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 50,
    castle1Rotation: 0,
    castle2Rotation: 0,
    castle3Rotation: 0,
  });
  const [gestureIndicator, setGestureIndicator] = useState<string>('');
  const gestureTimeoutRef = useRef<any>(null);
  const lastFrameTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const fpsBufferRef = useRef<number[]>([]);
  
  // Camera reference for tracking position
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Show gesture indicator with auto-hide
  const showGesture = (gesture: string) => {
    setGestureIndicator(gesture);
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => setGestureIndicator(''), 1500);
  };

  // Reset camera to default position
  const resetCamera = () => {
    targetCameraDistanceRef.current = CAMERA_DEFAULT_DISTANCE;
    targetCameraRotationRef.current = { ...CAMERA_DEFAULT_ROTATION };
    showGesture('🔄 RESET VIEW');
  };

  // Helper functions to update refs (run on JS thread)
  const updateCameraRotation = (deltaX: number, deltaY: number) => {
    // MORE RESPONSIVE CAMERA MOVEMENT
    targetCameraRotationRef.current.y += deltaX * 0.01;  // Increased from 0.005
    targetCameraRotationRef.current.x -= deltaY * 0.01;  // Increased from 0.005
    
    // Limit vertical rotation
    targetCameraRotationRef.current.x = Math.max(
      -Math.PI / 2.5,
      Math.min(Math.PI / 2.5, targetCameraRotationRef.current.x)
    );
  };

  const updateCameraZoom = (scale: number) => {
    const newDistance = touchStartDistanceRef.current / scale;
    targetCameraDistanceRef.current = Math.max(
      CAMERA_MIN_DISTANCE,
      Math.min(CAMERA_MAX_DISTANCE, newDistance)
    );
  };

  const saveTouchStartDistance = () => {
    touchStartDistanceRef.current = cameraDistanceRef.current;
  };

  // INDEPENDENT castle rotation - only rotate selected castle
  const rotateCastle = (castleIndex: number) => {
    if (castleIndex >= 0 && castleIndex < 3) {
      // Only rotate THIS castle, others stay the same
      castleRotationsRef.current[castleIndex] += Math.PI / 4;
      showGesture(`🏰 CASTLE ${castleIndex + 1} SPIN!`);
    }
  };

  // PROPER GESTURE HANDLING - react-native-gesture-handler with runOnJS
  // Pan gesture for rotating
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(showGesture)('🔄 ROTATING');
    })
    .onUpdate((event) => {
      // Run on JS thread to avoid worklet warning
      runOnJS(updateCameraRotation)(event.translationX, event.translationY);
    })
    .onEnd(() => {
      runOnJS(setGestureIndicator)('');
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(saveTouchStartDistance)();
      runOnJS(showGesture)('🤏 ZOOMING');
    })
    .onUpdate((event) => {
      // Run on JS thread to avoid worklet warning
      runOnJS(updateCameraZoom)(event.scale);
    })
    .onEnd(() => {
      runOnJS(setGestureIndicator)('');
    });

  // Tap gesture for spinning castles
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const tapX = event.x;
      const screenWidth = width;
      
      // Determine which castle
      let tappedCastle = -1;
      if (tapX < screenWidth / 3) {
        tappedCastle = 0;
      } else if (tapX < (2 * screenWidth) / 3) {
        tappedCastle = 1;
      } else {
        tappedCastle = 2;
      }
      
      // Run on JS thread
      runOnJS(rotateCastle)(tappedCastle);
    });

  // Combine all gestures - pan and pinch can happen simultaneously!
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    tapGesture
  );

  useEffect(() => {
    mountedRef.current = true;
    
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2000); // Change message every 2 seconds
    
    return () => {
      mountedRef.current = false;
      clearInterval(messageInterval);
      const frameId = animationRef.current;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const onContextCreate = async (gl: any) => {
    if (!mountedRef.current) return;
    
    // FORCE GPU RENDERING - Hardware acceleration settings
    const renderer = new Renderer({ 
      gl,
      antialias: true,
      powerPreference: 'high-performance', // Force high-performance GPU
      precision: 'highp', // High precision shaders
      alpha: true,
      premultipliedAlpha: true,
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
    }) as any;
    
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(1); // Optimize for performance (don't over-render)
    // Make renderer transparent so underlying ImageBackground shows
    renderer.setClearColor(0x000000, 0);
    
    // Enable GPU optimizations
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    renderer.sortObjects = false; // Skip sorting for performance
    renderer.info.autoReset = true;
    
    console.log('🎮 GPU RENDERING: high-performance mode enabled');
    console.log(`📊 GPU Info: ${renderer.info.render.triangles} triangles/frame`);

    const scene = new THREE.Scene();
    // Use gl.drawingBufferWidth/Height for proper aspect ratio
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    console.log(`📐 Canvas aspect ratio: ${aspect} (${gl.drawingBufferWidth}x${gl.drawingBufferHeight})`);
    
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    cameraRef.current = camera;  // Store camera reference
    
    // App is now ALWAYS in landscape mode - no need for portrait fallback
    // Castles are at y=0, so camera should look at y=0
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    console.log(`📷 LANDSCAPE: Camera at (0, 0, 50) looking at (0, 0, 0)`);


    // Balanced lighting to show true colors
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(10, 20, 10);
    scene.add(dir);
    // Add additional lights from multiple angles
    const sideLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sideLight.position.set(-10, 5, 5);
    scene.add(sideLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 10, -10);
    scene.add(backLight);
    console.log(`💡 Lights configured: ambient(1.0), directional(1.5), side(1.0), back(0.8)`);

    // Load castles
    const castles = await loadCastlesGroup(scene);
    
    // Hide loading spinner once models are loaded
    setLoading(false);

    // Animation loop - HEAVILY OPTIMIZED FOR PERFORMANCE
    let t = 0;
    const animate = () => {
      if (!mountedRef.current) {
        return; // Stop animation when unmounted
      }
      
      animationRef.current = requestAnimationFrame(animate);
      t += 0.01;
      frameCountRef.current++;

      // SMOOTH CAMERA INTERPOLATION (lerp) - FASTER RESPONSE
      const lerpFactor = 0.15;
      
      // Interpolate zoom
      cameraDistanceRef.current += 
        (targetCameraDistanceRef.current - cameraDistanceRef.current) * lerpFactor;
      
      // Interpolate rotation
      cameraRotationRef.current.x +=
        (targetCameraRotationRef.current.x - cameraRotationRef.current.x) * lerpFactor;
      cameraRotationRef.current.y +=
        (targetCameraRotationRef.current.y - cameraRotationRef.current.y) * lerpFactor;
      
      // Apply camera position based on spherical coordinates (orbit camera)
      const distance = cameraDistanceRef.current;
      const theta = cameraRotationRef.current.y;
      const phi = Math.PI / 2 + cameraRotationRef.current.x;
      
      camera.position.x = distance * Math.sin(phi) * Math.sin(theta);
      camera.position.y = distance * Math.cos(phi);
      camera.position.z = distance * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      // Animate castles with INDEPENDENT rotations (floating + user rotations)
      animateCastles(castles, t, castleRotationsRef.current);

      // UPDATE DEBUG INFO - ONLY EVERY 60 FRAMES (~1 second) to reduce lag
      if (frameCountRef.current % 60 === 0) {
        lastFrameTimeRef.current = Date.now();
        
        // Batch state update - camera positions and individual castle rotations
        setDebugInfo({
          cameraDistance: cameraDistanceRef.current,
          cameraX: camera.position.x,
          cameraY: camera.position.y,
          cameraZ: camera.position.z,
          castle1Rotation: castleRotationsRef.current[0] * (180 / Math.PI),
          castle2Rotation: castleRotationsRef.current[1] * (180 / Math.PI),
          castle3Rotation: castleRotationsRef.current[2] * (180 / Math.PI),
        });
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();

    // Cleanup - MEMORY MANAGEMENT
    return () => {
      const frameId = animationRef.current;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      
      // Dispose of 3D resources to prevent memory leaks
      castles.forEach(castle => {
        castle.traverse((child: any) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => {
                  if (mat.map) mat.map.dispose();
                  if (mat.normalMap) mat.normalMap.dispose();
                  if (mat.metalnessMap) mat.metalnessMap.dispose();
                  mat.dispose();
                });
              } else {
                if (child.material.map) child.material.map.dispose();
                if (child.material.normalMap) child.material.normalMap.dispose();
                if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                child.material.dispose();
              }
            }
          }
        });
      });
      
      renderer.dispose();
      scene.clear();
    };
  };

  return (
    <GestureDetector gesture={composedGestures}>
      <View style={styles.container}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
      
      {/* LOADING SCREEN */}
      {loading && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      )}
      
      {/* DEBUG OVERLAY - CAMERA & CASTLE POSITIONS */}
      {!loading && (
        <View style={styles.debugOverlay} pointerEvents="none">
          <Text style={styles.debugTitle}>📊 Camera</Text>
          <Text style={styles.debugText}>X: {debugInfo.cameraX.toFixed(1)}</Text>
          <Text style={styles.debugText}>Y: {debugInfo.cameraY.toFixed(1)}</Text>
          <Text style={styles.debugText}>Z: {debugInfo.cameraZ.toFixed(1)}</Text>
          <Text style={styles.debugText}>Zoom: {debugInfo.cameraDistance.toFixed(0)}u</Text>
          <Text style={styles.debugTitle}>🏰 Castles</Text>
          <Text style={styles.debugText}>C1: {debugInfo.castle1Rotation.toFixed(0)}°</Text>
          <Text style={styles.debugText}>C2: {debugInfo.castle2Rotation.toFixed(0)}°</Text>
          <Text style={styles.debugText}>C3: {debugInfo.castle3Rotation.toFixed(0)}°</Text>
        </View>
      )}
      

      
      {/* REMOVED: Touch visual indicators - caused lag and memory issues */}
      
      {/* GESTURE FEEDBACK */}
      {gestureIndicator && (
        <View style={styles.gestureIndicator} pointerEvents="none">
          <Text style={styles.gestureText}>{gestureIndicator}</Text>
        </View>
      )}
      
      {/* INSTRUCTIONS - BOTTOM */}
      {!loading && !gestureIndicator && (
        <View style={styles.instructions} pointerEvents="none">
          <Text style={styles.instructionText}>🤏 Pinch zoom (35-80u) • 🔄 Swipe rotate • 👆 Tap castle to spin</Text>
        </View>
      )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gl: { 
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent' 
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8b5cf6',
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8b5cf6',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  // DEBUG OVERLAY - TOP RIGHT
  debugOverlay: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 12,
    minWidth: 140,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
    marginTop: 4,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#ffffff',
    marginBottom: 1,
  },

  // TOUCH INDICATORS
  touchIndicator: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.8)',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  // GESTURE FEEDBACK
  gestureIndicator: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gestureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
