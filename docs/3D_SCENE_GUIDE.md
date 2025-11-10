# 3D CloudyBackground Scene - Setup Guide

## Overview
The CloudyBackground component creates an immersive 3D landscape scene that automatically switches to **landscape mode** when the user logs in. It features:

- 🏰 **6 Castle Models** - 1 center, 2 left, 3 right with auto-rotation
- ☁️ **Dynamic Clouds** - 15 floating cloud spheres with drift animation
- 🌅 **Time-Based Sky** - Changes color based on time of day (day/sunset/night)
- 📱 **Auto Landscape Lock** - Forces landscape orientation when active
- 🎥 **Camera Animation** - Gentle sway for immersive experience

## File Structure

```
components/3d/
├── CloudyBackground.tsx    # Main component with scene setup
├── CastlesGroup.tsx       # Castle loading and animation logic
├── CloudLayer.tsx         # Cloud creation and animation
└── BackgroundScene.tsx    # Auth screens (portrait mode)

assets/models/
├── castle1.glb
├── castle2.glb
└── castle3.glb
```

## Component Details

### CloudyBackground.tsx
**Purpose:** Main 3D scene for logged-in users (landscape mode)

**Features:**
- Locks screen to landscape orientation on mount
- Dynamic sky colors (day: #87ceeb, sunset: #ffcc70, night: #0a0e27)
- Three-point lighting system (ambient + directional + 2 point lights)
- Fog effect for depth perception
- Green grass ground plane
- Camera sway animation

**Usage:**
```tsx
import CloudyBackground from '@/components/3d/CloudyBackground';

<View style={{ flex: 1 }}>
  <CloudyBackground />
  <View style={overlayStyles}>
    {/* Your UI here */}
  </View>
</View>
```

### CastlesGroup.tsx
**Purpose:** Handles castle model loading and animations

**Castle Configuration:**
| Position | Model | X | Z | Scale | Rotation |
|----------|-------|---|---|-------|----------|
| Center | castle1 | 0 | -5 | 2.5 | 0° |
| Left 1 | castle2 | -18 | -8 | 1.8 | 30° |
| Left 2 | castle3 | -25 | -12 | 1.5 | 45° |
| Right 1 | castle1 | 18 | -8 | 1.8 | -30° |
| Right 2 | castle2 | 25 | -10 | 1.6 | -36° |
| Right 3 | castle3 | 30 | -14 | 1.4 | -45° |

**Animations:**
- Auto-rotation: 0.003 + (index * 0.001) rad/frame
- Bobbing: sin(time * 0.5 + index * 0.8) * 0.3 units
- Sway: sin(time * 0.3 + index) * 0.02 rad

### CloudLayer.tsx
**Purpose:** Creates and animates cloud formations

**Cloud Properties:**
- Count: 15 clouds
- Size: Random 1.5-3.5 radius
- Opacity: 0.7
- Color: White (#ffffff)
- Distribution: 100 units wide, 15 units high

**Animations:**
- Horizontal drift: sin(time * 0.3 + index) * 0.02
- Vertical float: cos(time * 0.2 + index) * 0.01

## Technical Stack

- **expo-three** v8.0.0 - WebGL integration for React Native
- **three.js** v0.166.1 - 3D graphics library
- **expo-gl** - OpenGL ES context
- **expo-screen-orientation** - Landscape lock
- **expo-asset** - GLTF model loading

## Screen Orientation Flow

```
Login Screen (Portrait) 
    ↓
User Authenticates
    ↓
Home Screen with CloudyBackground (Landscape)
    ↓
Component Unmounts
    ↓
Orientation Unlocked
```

## Performance Optimization

1. **Low-poly models** - Simple sphere geometries for clouds
2. **Efficient animations** - Math.sin/cos calculations only
3. **Single render loop** - requestAnimationFrame
4. **Lazy loading** - Models loaded async with Promise.all
5. **Simple materials** - MeshPhongMaterial for performance

## Time-Based Sky Colors

```typescript
const hour = new Date().getHours();
let skyColor = 0x87ceeb; // Day (6 AM - 4 PM)
if (hour >= 18 || hour < 6) skyColor = 0x0a0e27; // Night (6 PM - 6 AM)
else if (hour >= 16 && hour < 18) skyColor = 0xffcc70; // Sunset (4 PM - 6 PM)
```

## Camera Setup

- **FOV:** 75°
- **Position:** (0, 5, 20) with dynamic X sway
- **Look At:** (0, 2, 0)
- **Sway Animation:** 
  - X: sin(time * 0.2) * 2
  - Y: 5 + cos(time * 0.15) * 1

## Customization

### Adjust Castle Count
Edit `CastlesGroup.tsx` line 20-31:
```typescript
const castleConfigs: CastleConfig[] = [
  { model: castle1, x: 0, z: -5, scale: 2.5, rotationY: 0 },
  // Add more configurations...
];
```

### Change Cloud Density
Edit `CloudLayer.tsx` line 5:
```typescript
for (let i = 0; i < 15; i++) { // Change 15 to desired count
```

### Modify Animation Speed
Edit animation multipliers in respective files:
- Castles: `castle.rotation.y += 0.003` (line 78 in CastlesGroup.tsx)
- Clouds: `cloud.position.x += Math.sin(time * 0.3 ...)` (line 39 in CloudLayer.tsx)

## Troubleshooting

**Issue:** Black screen on load
- Check that all 3 .glb files exist in `assets/models/`
- Verify expo-asset and expo-three are installed

**Issue:** Scene doesn't rotate to landscape
- Ensure `expo-screen-orientation` is installed
- Check device orientation lock is disabled

**Issue:** Castles not appearing
- Check console for GLTF loading errors
- Verify model file sizes aren't corrupted
- Ensure `loadAsync` from expo-three is working

## Integration Example

```tsx
// app/(tabs)/index.tsx
import CloudyBackground from '@/components/3d/CloudyBackground';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <CloudyBackground />
      <View style={{
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 32 }}>
          🏰 Being Cosmic
        </Text>
      </View>
    </View>
  );
}
```

## Next Steps

1. ✅ CloudyBackground with 6 castles implemented
2. ✅ Landscape orientation lock added
3. ✅ Dynamic time-based sky colors
4. ✅ Smooth animations for castles and clouds
5. 🔄 Consider adding:
   - Interactive castle selection
   - Particle effects (stars, fireflies)
   - Sound effects on tap
   - Pinch-to-zoom camera controls
   - Different weather conditions

---

**Created for BeingCosmicApp** - An immersive 3D learning platform
