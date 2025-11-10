# CloudyBackground Troubleshooting Guide

## Common Mobile Errors & Fixes

### Issue: Black Screen or App Crashes on Load

**Symptoms:**
- Screen goes black when navigating to home
- App crashes immediately after login
- Console shows GLTF loading errors

**Solutions:**

1. **Check Console Logs**
   - Look for messages starting with ❌ or ⚠️
   - GLTF loading errors mean castle models aren't loading

2. **Use SimpleBackground Fallback**
   ```tsx
   // In app/(tabs)/index.tsx
   import SimpleBackground from '@/components/3d/SimpleBackground';
   
   // Replace CloudyBackground with:
   <SimpleBackground />
   ```

3. **Verify GLB Files Exist**
   ```
   assets/models/
   ├── castle1.glb
   ├── castle2.glb
   └── castle3.glb
   ```

4. **Check Metro Bundler**
   - Ensure `.glb` files are being bundled
   - Clear cache: `npx expo start -c`

---

### Issue: Screen Doesn't Rotate to Landscape

**Symptoms:**
- Home screen stays in portrait mode
- 3D scene appears squished or stretched

**Solutions:**

1. **Check Screen Orientation Package**
   ```cmd
   npm install expo-screen-orientation
   ```

2. **Device Settings**
   - Ensure auto-rotate is enabled on device
   - Some devices have rotation lock in quick settings

3. **iOS Specific**
   - Check app.json has orientation set:
   ```json
   "orientation": "default"
   ```

4. **Temporary Fix - Remove Orientation Lock**
   Comment out in CloudyBackground.tsx:
   ```tsx
   // useEffect(() => {
   //   ScreenOrientation.lockAsync(...);
   // }, []);
   ```

---

### Issue: Performance Issues / Low FPS

**Symptoms:**
- Choppy animations
- Slow camera movement
- App feels sluggish

**Solutions:**

1. **Reduce Cloud Count**
   In `components/3d/CloudLayer.tsx` line 5:
   ```tsx
   for (let i = 0; i < 8; i++) { // Changed from 15
   ```

2. **Disable Castles Temporarily**
   In `components/3d/CloudyBackground.tsx`:
   ```tsx
   // Comment out castle loading
   // const castles = await loadCastlesGroup(scene);
   let castles: THREE.Group[] = [];
   ```

3. **Reduce Animation Speed**
   ```tsx
   time += 0.005; // Instead of 0.01
   ```

4. **Lower Resolution**
   In CloudyBackground.tsx:
   ```tsx
   renderer.setSize(width * 0.75, height * 0.75);
   ```

---

### Issue: GLB Models Not Loading

**Symptoms:**
- Console shows "Error loading castle"
- Castles don't appear in scene
- Only clouds and ground visible

**Solutions:**

1. **Check File Paths**
   ```tsx
   // Verify require paths are correct
   const castle1 = require('../../assets/models/castle1.glb');
   ```

2. **Test with Simple Shapes**
   Replace castle loading with test cubes:
   ```tsx
   const geometry = new THREE.BoxGeometry(2, 2, 2);
   const material = new THREE.MeshPhongMaterial({ color: 0x8b5cf6 });
   const cube = new THREE.Mesh(geometry, material);
   scene.add(cube);
   ```

3. **Check GLB File Validity**
   - Open .glb files in a 3D viewer (e.g., https://gltf-viewer.donmccurdy.com/)
   - Ensure files aren't corrupted
   - Try re-exporting from Blender/3D software

4. **Use SimpleBackground**
   Fallback component with colored cubes instead of GLB models

---

### Issue: "Cannot find module" Errors

**Symptoms:**
```
Error: Cannot find module 'expo-three'
Error: Cannot find module '@/components/3d/...'
```

**Solutions:**

1. **Install Missing Dependencies**
   ```cmd
   cd bc-app
   npm install expo-three three expo-gl expo-asset
   npm install @types/three --save-dev
   ```

2. **Clear Cache and Restart**
   ```cmd
   npx expo start -c
   ```

3. **Check tsconfig.json Paths**
   Ensure `@/*` is mapped to workspace root

---

### Issue: White/Blank Screen

**Symptoms:**
- Screen is white or shows nothing
- No errors in console
- Components seem to load but nothing renders

**Solutions:**

1. **Check StyleSheet**
   ```tsx
   container: {
     flex: 1, // This is crucial!
     backgroundColor: '#000', // For debugging
   }
   ```

2. **Verify GLView**
   ```tsx
   <GLView 
     style={{ flex: 1 }} 
     onContextCreate={onContextCreate} 
   />
   ```

3. **Test Without 3D**
   ```tsx
   <View style={{ flex: 1, backgroundColor: 'red' }}>
     <Text>Testing</Text>
   </View>
   ```

---

## Debug Mode

Enable detailed logging in CloudyBackground.tsx:

```tsx
const onContextCreate = async (gl: any) => {
  console.log('🔧 GL Context created');
  
  try {
    const renderer = new Renderer({ gl }) as any;
    console.log('✅ Renderer initialized');
    
    // ... scene setup
    console.log('✅ Scene created');
    
    const castles = await loadCastlesGroup(scene);
    console.log(`✅ Loaded ${castles.length} castles`);
    
    animate();
    console.log('✅ Animation loop started');
  } catch (error) {
    console.error('❌ Full error:', error);
  }
};
```

---

## Quick Fixes Summary

| Problem | Quick Fix |
|---------|-----------|
| Black screen | Use SimpleBackground.tsx |
| Won't rotate | Comment out ScreenOrientation.lockAsync |
| Low FPS | Reduce cloud count to 8 |
| No castles | Check console, verify .glb files exist |
| Crashes | Clear cache: `npx expo start -c` |
| White screen | Check styles have `flex: 1` |

---

## Component Alternatives

### 1. CloudyBackground.tsx (Full Version)
- ✅ 6 GLB castle models
- ✅ 15 clouds
- ✅ Dynamic sky colors
- ⚠️ More resource intensive

### 2. SimpleBackground.tsx (Fallback)
- ✅ 6 colored cube "buildings"
- ✅ 15 clouds
- ✅ Dynamic sky colors
- ✅ Lighter, no GLB loading

### 3. BackgroundScene.tsx (Auth Screens)
- ✅ 3 planets
- ✅ 50+ stars
- ✅ Portrait mode
- ✅ Fastest performance

---

## Testing Checklist

Before deploying:

- [ ] Test on physical device (not just emulator)
- [ ] Check console for errors
- [ ] Verify landscape rotation works
- [ ] Test with airplane mode (offline assets)
- [ ] Check FPS (should be 30+ minimum)
- [ ] Test both iOS and Android
- [ ] Verify memory usage (< 200MB)
- [ ] Test on low-end device

---

## Emergency Rollback

If 3D backgrounds cause issues, quickly disable:

```tsx
// app/(tabs)/index.tsx
export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0e27' }}>
      <View style={styles.overlay}>
        <Text style={styles.title}>🏰 Being Cosmic</Text>
        <Text style={styles.subtitle}>Explore the magical world of learning</Text>
      </View>
    </View>
  );
}
```

---

## Contact & Support

If issues persist:
1. Check Metro bundler terminal for errors
2. Check device console logs
3. Try `npm install` and restart
4. Check 3D_SCENE_GUIDE.md for configuration details
