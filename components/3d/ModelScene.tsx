import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { loadCastlesGroup, animateCastles } from './CastlesGroup';

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
    renderer.setSize(width, height);
    // Make renderer transparent so underlying ImageBackground shows
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    // Camera positioned to match bg.jpg perspective
    // Centered view, slightly elevated to see castles on ground
    camera.position.set(0, 3, 25);
    camera.lookAt(0, -2, 0); // Look slightly down at ground level

    // Stronger lights for better texture visibility
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 20, 10);
    scene.add(dir);
    // Add additional light from the side for better texture definition
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sideLight.position.set(-10, 5, 5);
    scene.add(sideLight);

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

      // Very gentle camera sway - keep it mostly static to match bg
      camera.position.x = Math.sin(t * 0.08) * 1.5;
      camera.position.y = 3 + Math.sin(t * 0.12) * 0.5;
      camera.position.z = 25 + Math.cos(t * 0.08) * 1;
      camera.lookAt(0, -2, 0);  // Look at ground level

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
      <GLView style={[styles.gl, { width, height }]} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  gl: { flex: 1, backgroundColor: 'transparent' },
});
