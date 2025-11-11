import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as THREE from 'three';
import { animateCastles, loadCastlesGroup } from './CastlesGroup';

const LOADING_MESSAGES = [
  'Summoning magical realms...',
  'Crafting floating castles...',
  'Painting enchanted textures...',
  'Weaving cosmic threads...',
  'Channeling mystical energies...',
];

export default function ModelScene() {
  const { width, height } = useWindowDimensions();
  const mountedRef = useRef(true);
  const animationRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

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
    
    const renderer = new Renderer({ gl }) as any;
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    // Make renderer transparent so underlying ImageBackground shows
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    // Use gl.drawingBufferWidth/Height for proper aspect ratio
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    console.log(`📐 Canvas aspect ratio: ${aspect} (${gl.drawingBufferWidth}x${gl.drawingBufferHeight})`);
    
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // Adjust positioning based on aspect ratio (portrait vs landscape)
    const isPortrait = aspect < 1;
    
    if (isPortrait) {
      // PORTRAIT MODE: Camera needs to be positioned differently
      camera.position.set(0, 0, 50);
      camera.lookAt(0, 0, 0);
      console.log(`📷 PORTRAIT: Camera at (0, 0, 50) looking at (0, 0, 0)`);
    } else {
      // LANDSCAPE MODE
      camera.position.set(0, -3, 45);
      camera.lookAt(0, -3, 0);
      console.log(`📷 LANDSCAPE: Camera at (0, -3, 45) looking at (0, -3, 0)`);
    }


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

    // Animation loop
    let t = 0;
    const animate = () => {
      if (!mountedRef.current) {
        return; // Stop animation when unmounted
      }
      
      animationRef.current = requestAnimationFrame(animate);
      t += 0.01;

      // Camera sway adjusted for orientation
      const isPortrait = camera.aspect < 1;
      
      if (isPortrait) {
        camera.position.x = Math.sin(t * 0.08) * 2;
        camera.position.y = Math.sin(t * 0.12) * 1;
        camera.position.z = 50 + Math.cos(t * 0.08) * 2;
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.x = Math.sin(t * 0.08) * 2;
        camera.position.y = -3 + Math.sin(t * 0.12) * 1;
        camera.position.z = 45 + Math.cos(t * 0.08) * 2;
        camera.lookAt(0, -3, 0);
      }

      // animate castles
      animateCastles(castles, t);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    animate();

    // Cleanup
    return () => {
      const frameId = animationRef.current;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
      {loading && (
        <View style={styles.loadingContainer}>
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
    </View>
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
});
