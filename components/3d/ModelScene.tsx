import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import * as THREE from 'three';
import { animateCastles, loadCastlesGroup } from './CastlesGroup';

export default function ModelScene() {
  const { width, height } = useWindowDimensions();
  const mountedRef = useRef(true);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
    // Camera positioned CENTERED and pulled back for landscape view
    camera.position.set(0, 0, 60);
    camera.lookAt(0, 0, 0); // Look at scene center
    console.log(`📷 Camera positioned at (0, 0, 60)`);


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

    // For now, skip GLB loading and use procedural castles directly
    // (GLB models can be added later via static imports if needed)
    const castles = await loadCastlesGroup(scene);

    // Animation loop
    let t = 0;
    const animate = () => {
      if (!mountedRef.current) {
        return; // Stop animation when unmounted
      }
      
      animationRef.current = requestAnimationFrame(animate);
      t += 0.01;

      // Very gentle camera sway for landscape view - keep centered
      camera.position.x = Math.sin(t * 0.08) * 2;
      camera.position.y = Math.sin(t * 0.12) * 1.5;
      camera.position.z = 60 + Math.cos(t * 0.08) * 3;
      camera.lookAt(0, 0, 0);  // Look at scene center

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
});
