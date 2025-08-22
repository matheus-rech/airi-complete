import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Live2DCharacter = ({ 
  modelPath = '/assets/live2d/models/hiyori_free_zh/hiyori_free_zh.model3.json',
  isVisible = true,
  expression = 'neutral',
  isListening = false,
  isSpeaking = false 
}) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    
    renderer.setSize(400, 600);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 1;

    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Load Live2D model (placeholder implementation)
    loadLive2DModel();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (modelRef.current) {
        // Update model animations
        updateModelAnimations();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const loadLive2DModel = async () => {
    try {
      setError(null);
      
      // For now, create a placeholder 3D character
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: isSpeaking ? 0xff6b9d : 0x9d6bff,
        transparent: true,
        opacity: 0.8
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(0, 0, 0);
      
      // Add eyes
      const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 0.1, 0.25);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 0.1, 0.25);
      
      sphere.add(leftEye);
      sphere.add(rightEye);
      
      // Add mouth
      const mouthGeometry = new THREE.RingGeometry(0.02, 0.04, 8);
      const mouthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        side: THREE.DoubleSide
      });
      
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.position.set(0, -0.05, 0.25);
      mouth.rotation.x = Math.PI / 2;
      
      sphere.add(mouth);
      
      sceneRef.current.add(sphere);
      modelRef.current = sphere;
      
      setIsLoaded(true);
      
    } catch (err) {
      console.error('Failed to load Live2D model:', err);
      setError('Failed to load character model');
    }
  };

  const updateModelAnimations = () => {
    if (!modelRef.current) return;

    const time = Date.now() * 0.001;
    
    // Breathing animation
    const breathScale = 1 + Math.sin(time * 2) * 0.02;
    modelRef.current.scale.y = breathScale;
    
    // Idle movement
    modelRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    
    // Speaking animation
    if (isSpeaking) {
      const speakIntensity = Math.sin(time * 10) * 0.1;
      modelRef.current.scale.x = 1 + speakIntensity;
      modelRef.current.scale.z = 1 + speakIntensity;
      
      // Change color when speaking
      if (modelRef.current.material) {
        modelRef.current.material.color.setHex(0xff6b9d);
      }
    } else {
      modelRef.current.scale.x = 1;
      modelRef.current.scale.z = 1;
      
      if (modelRef.current.material) {
        modelRef.current.material.color.setHex(0x9d6bff);
      }
    }
    
    // Listening animation
    if (isListening) {
      const pulseIntensity = Math.sin(time * 5) * 0.05;
      modelRef.current.material.opacity = 0.8 + pulseIntensity;
    } else {
      modelRef.current.material.opacity = 0.8;
    }
    
    // Expression changes
    if (expression === 'happy') {
      modelRef.current.rotation.z = Math.sin(time * 3) * 0.05;
    } else if (expression === 'surprised') {
      modelRef.current.scale.setScalar(1.1);
    } else {
      modelRef.current.scale.setScalar(1);
      modelRef.current.rotation.z = 0;
    }
  };

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = isVisible;
    }
  }, [isVisible]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">⚠️</div>
          <div className="text-sm text-gray-400">{error}</div>
          <div className="text-xs text-gray-500 mt-1">Using fallback character</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-900/10 to-pink-900/10 rounded-lg border border-purple-500/20 overflow-hidden">
      {/* Character Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
      
      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="text-sm text-gray-300">Loading AIRI...</div>
          </div>
        </div>
      )}
      
      {/* Status Indicators */}
      {isLoaded && (
        <div className="absolute top-2 right-2 flex gap-1">
          {isSpeaking && (
            <div className="px-2 py-1 bg-pink-500/80 text-white text-xs rounded-full animate-pulse">
              Speaking
            </div>
          )}
          {isListening && (
            <div className="px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full animate-pulse">
              Listening
            </div>
          )}
        </div>
      )}
      
      {/* Character Info */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400">
        <div>AIRI Character</div>
        <div className="text-purple-400">Live2D Ready</div>
      </div>
    </div>
  );
};

export default Live2DCharacter;

