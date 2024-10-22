import React, { useRef, useEffect } from 'react';
import '../App.css'
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

interface AudioVisualizerProps {
  audioData: number[];
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);

    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45,mountRef.current.clientWidth/ mountRef.current.clientHeight, 0.1, 1000);

    const params = {
      red: 1.0,
      green: 1.0,
      blue: 1.0,
      threshold: 0.5,   // Lower threshold allows more glow
      strength: 0.5,    // Increased strength for more intense bloom
      radius: 0.8      // Slightly reduced radius for sharper bloom
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight)
    );
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const outputPass = new OutputPass();
    bloomComposer.addPass(outputPass);

    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);

    // Later in the code, update the initial uniform values:
    const uniforms = {
      u_time: { type: 'f', value: 0.0 },
      u_frequency: { type: 'f', value: 0.0 },
      u_red: { type: 'f', value: 1.0 },    // Full brightness
      u_green: { type: 'f', value: 1.0 },  // Full brightness
      u_blue: { type: 'f', value: 1.0 }    // Full brightness
    }

    // Shaders
    const vertexShader = `
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_frequency;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.xyz += normal * sin(u_time * 0.5) * u_frequency * 0.05;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_red;
      uniform float u_green;
      uniform float u_blue;
      
      void main() {
        gl_FragColor = vec4(u_red, u_green, u_blue, 1.0);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });

    const geo = new THREE.IcosahedronGeometry(4, 30);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    mesh.material.wireframe = true;

    const gui = new GUI();

    const colorsFolder = gui.addFolder('Colors');
    colorsFolder.add(params, 'red', 0, 1).onChange(function(value) {
      uniforms.u_red.value = Number(value);
    });
    colorsFolder.add(params, 'green', 0, 1).onChange(function(value) {
      uniforms.u_green.value = Number(value);
    });
    colorsFolder.add(params, 'blue', 0, 1).onChange(function(value) {
      uniforms.u_blue.value = Number(value);
    });

    const bloomFolder = gui.addFolder('Bloom');
    bloomFolder.add(params, 'threshold', 0, 1).onChange(function(value) {
      bloomPass.threshold = Number(value);
    });
    bloomFolder.add(params, 'strength', 0, 3).onChange(function(value) {
      bloomPass.strength = Number(value);
    });
    bloomFolder.add(params, 'radius', 0, 1).onChange(function(value) {
      bloomPass.radius = Number(value);
    });

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) / 100;
      mouseY = (e.clientY - windowHalfY) / 100;
    };
    document.addEventListener('mousemove', handleMouseMove);

    const clock = new THREE.Clock();
    function animate() {
      camera.position.x += (mouseX - camera.position.x) * .05;
      camera.position.y += (-mouseY - camera.position.y) * 0.5;
      camera.lookAt(scene.position);
      uniforms.u_time.value = clock.getElapsedTime();
      
      // Instead of using analyser, we use the passed audioData
      if (audioData.length > 0) {
        uniforms.u_frequency.value = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
      }
      
      bloomComposer.render();
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      bloomComposer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      gui.destroy();
    };
  }, [audioData]);

  return (
    <div ref={mountRef} className='audio-visualizer'/>
  );
};

export default AudioVisualizer;