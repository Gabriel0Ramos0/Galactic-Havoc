// app/screens/SandboxScreen.jsx
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';

export default function SandboxScreen() {
  const glRef = useRef();

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);

    // Cena
    const scene = new THREE.Scene();

    // Câmera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Estrelas
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const starVertices = [];

    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );

    // Criar textura circular para estrelas
    const starTexture = new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/sprites/circle.png'
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      map: starTexture,   // textura circular
      transparent: true,  // precisa ser true para não ficar com quadrado branco
      alphaTest: 0.5
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);


    // Nave (cone menor, reposicionado)
    const shipGeometry = new THREE.ConeGeometry(0.5, 1, 16); //modelo da nave
    const shipMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    ship.rotation.x = Math.PI / 2; // apontando para frente
    ship.position.set(0, -0.1, 0); // levemente mais baixo
    scene.add(ship);

    // Velocidade da nave
    const velocity = new THREE.Vector3(0, 0, -0.1);

    // Animação
    const animate = () => {
      requestAnimationFrame(animate);

      // Movimento da nave
      ship.position.add(velocity);

      // Câmera acompanha a nave (fica atrás e acima dela)
      camera.position.copy(ship.position).add(new THREE.Vector3(0, 2, 5));
      camera.lookAt(ship.position);

      // Pequena rotação da nave (só efeito visual)
      ship.rotation.z += 0.002;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return (
    <View style={styles.container}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
        ref={glRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
