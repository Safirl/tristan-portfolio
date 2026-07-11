import type { Source } from "@plugins/three-base-experience";

const sources: Source[] = [
  // {
  //   name: "environmentMapTexture",
  //   type: "cubeTexture",
  //   path: [
  //     "textures/environmentMap/px.jpg",
  //     "textures/environmentMap/nx.jpg",
  //     "textures/environmentMap/py.jpg",
  //     "textures/environmentMap/ny.jpg",
  //     "textures/environmentMap/pz.jpg",
  //     "textures/environmentMap/nz.jpg",
  //   ],
  // },
  // {
  //   name: "environmentMapTexture1",
  //   type: "cubeTexture",
  //   path: [
  //     "textures/environmentMap/1/px.png",
  //     "textures/environmentMap/1/nx.png",
  //     "textures/environmentMap/1/py.png",
  //     "textures/environmentMap/1/ny.png",
  //     "textures/environmentMap/1/pz.png",
  //     "textures/environmentMap/1/nz.png",
  //   ],
  // },
  {
    name: "environmentMapTexture",
    type: "cubeTexture",
    path: [
      "textures/environmentMap/2/px.png",
      "textures/environmentMap/2/nx.png",
      "textures/environmentMap/2/py.png",
      "textures/environmentMap/2/ny.png",
      "textures/environmentMap/2/pz.png",
      "textures/environmentMap/2/nz.png",
    ],
  },
  {
    name: "grassColorTexture",
    type: "texture",
    path: "textures/dirt/color.jpg",
  },
  {
    name: "Rendus 3D Christian Boragine",
    type: "texture",
    path: "content/images/Rendus 3D Christian Boragine.jpg",
  },
  {
    name: "grassNormalTexture",
    type: "texture",
    path: "textures/dirt/normal.jpg",
  },
  {
    name: "foxModel",
    type: "gltfModel",
    path: "models/Fox/glTF/Fox.gltf",
  },
  {
    name: "trumpetModel",
    type: "gltfModel",
    path: "models/trumpet/trumpet.gltf",
  },
];

export default sources;
