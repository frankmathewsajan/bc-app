// Model manifest for 3D files used by the 3D scene.
// This exports the castle model files that will be loaded into the app.
// Metro bundler requires static require() calls for native assets.
// Using uncompressed GLB files with texture references

/* eslint-disable @typescript-eslint/no-require-imports */
export default [
  {
    model: require('./castle1_1.glb'),
    textures: [
      require('./castle1_1_img0.jpg'),
      require('./castle1_1_img1.jpg'),
      require('./castle1_1_img2.jpg'),
    ]
  },
  {
    model: require('./castle1_2.glb'),
    textures: [
      require('./castle1_2_img0.jpg'),
      require('./castle1_2_img1.jpg'),
      require('./castle1_2_img2.jpg'),
    ]
  },
  {
    model: require('./castle1_3.glb'),
    textures: [
      require('./castle1_3_img0.jpg'),
      require('./castle1_3_img1.jpg'),
      require('./castle1_3_img2.jpg'),
    ]
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */
