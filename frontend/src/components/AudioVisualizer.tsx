import React, { useRef, useEffect, useState } from 'react';
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
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  useEffect(() => {
    if (!mountRef.current) {
      setDebugInfo('Mount ref is null');
      return;
    }

    setDebugInfo('Setting up scene...');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    setDebugInfo('Creating geometry...');

    const geometry = new THREE.IcosahedronGeometry(1, 15);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    setDebugInfo('Setting up post-processing...');

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    setDebugInfo('Setting up GUI...');

    const gui = new GUI();
    const params = {
      wireframe: true,
      color: '#ffffff',
      bloomStrength: 1.5,
      bloomRadius: 0.4,
      bloomThreshold: 0.85
    };

    gui.add(params, 'wireframe').onChange((value) => {
      material.wireframe = value;
    });
    gui.addColor(params, 'color').onChange((value) => {
      material.color.set(value);
    });
    gui.add(params, 'bloomStrength', 0, 3).onChange((value) => {
      bloomPass.strength = Number(value);
    });
    gui.add(params, 'bloomRadius', 0, 1).onChange((value) => {
      bloomPass.radius = Number(value);
    });
    gui.add(params, 'bloomThreshold', 0, 1).onChange((value) => {
      bloomPass.threshold = Number(value);
    });

    setDebugInfo('Starting animation...');

    const animate = () => {
      requestAnimationFrame(animate);

      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;

      if (audioData.length > 0) {
        const averageFrequency = audioData.reduce((sum, value) => sum + value, 0) / audioData.length;
        mesh.scale.set(1 + averageFrequency / 100, 1 + averageFrequency / 100, 1 + averageFrequency / 100);
      }

      composer.render();
    };

    animate();

    setDebugInfo('Visualization running');

    return () => {
      setDebugInfo('Cleaning up...');
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      gui.destroy();
    };
  }, []);

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '400px', border: '0px solid white' }} />
      <div style={{ color: 'white', marginTop: '10px' }}>Debug: {debugInfo}</div>
      <div style={{ color: 'white' }}>Audio Data Length: {audioData.length}</div>
    </div>
  );
};

export default AudioVisualizer;