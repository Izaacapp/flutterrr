import * as THREE from 'three';

interface PreloadedResources {
  textures: Map<string, THREE.Texture>;
  geometries: Map<string, THREE.BufferGeometry>;
  materials: Map<string, THREE.Material>;
  isLoaded: boolean;
}

class EarthPreloader {
  private static instance: EarthPreloader;
  private resources: PreloadedResources = {
    textures: new Map(),
    geometries: new Map(),
    materials: new Map(),
    isLoaded: false
  };
  private loadingPromise: Promise<void> | null = null;

  static getInstance(): EarthPreloader {
    if (!EarthPreloader.instance) {
      EarthPreloader.instance = new EarthPreloader();
    }
    return EarthPreloader.instance;
  }

  async preloadResources(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.resources.isLoaded) {
      return Promise.resolve();
    }

    this.loadingPromise = this.doPreload();
    return this.loadingPromise;
  }

  private async doPreload(): Promise<void> {
    const textureLoader = new THREE.TextureLoader();
    
    // Preload textures
    const textureUrls = [
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'
    ];

    const texturePromises = textureUrls.map(async (url, index) => {
      try {
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(url, resolve, undefined, reject);
        });
        
        const key = index === 0 ? 'earth_diffuse' : 'earth_normal';
        this.resources.textures.set(key, texture);
      } catch (error) {
        console.warn(`Failed to load texture: ${url}`, error);
      }
    });

    // Preload geometries
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const starGeometry = new THREE.BufferGeometry();
    
    // Create starfield
    const starPositions = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starPositions.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

    this.resources.geometries.set('earth', earthGeometry);
    this.resources.geometries.set('atmosphere', atmosphereGeometry);
    this.resources.geometries.set('stars', starGeometry);
    this.resources.geometries.set('airport_marker', new THREE.SphereGeometry(0.03, 16, 16));
    this.resources.geometries.set('airplane_body', new THREE.CylinderGeometry(0.01, 0.02, 0.08, 8));
    this.resources.geometries.set('airplane_wing', new THREE.BoxGeometry(0.12, 0.01, 0.02));
    this.resources.geometries.set('airplane_tail', new THREE.BoxGeometry(0.02, 0.04, 0.01));

    // Preload materials
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xc4b5fd,
      emissive: 0xe9d5ff,
      emissiveIntensity: 0.2,
      shininess: 50
    });

    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xddd6fe,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });

    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xddd6fe,
      size: 0.08,
      transparent: true,
      opacity: 0.4
    });

    this.resources.materials.set('earth', earthMaterial);
    this.resources.materials.set('atmosphere', atmosphereMaterial);
    this.resources.materials.set('stars', starsMaterial);
    this.resources.materials.set('origin_marker', new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    this.resources.materials.set('dest_marker', new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    this.resources.materials.set('airplane', new THREE.MeshPhongMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.3
    }));

    // Wait for all textures to load
    await Promise.allSettled(texturePromises);
    
    // Don't apply textures to the base material - let Earth component handle that
    // This way the Earth stays visible with purple color initially

    this.resources.isLoaded = true;
    console.log('Earth resources preloaded successfully');
  }

  getGeometry(name: string): THREE.BufferGeometry | undefined {
    return this.resources.geometries.get(name);
  }

  getMaterial(name: string): THREE.Material | undefined {
    return this.resources.materials.get(name);
  }

  getTexture(name: string): THREE.Texture | undefined {
    return this.resources.textures.get(name);
  }

  isResourcesLoaded(): boolean {
    return this.resources.isLoaded;
  }

  // Clean up resources when not needed
  dispose(): void {
    this.resources.textures.forEach(texture => texture.dispose());
    this.resources.geometries.forEach(geometry => geometry.dispose());
    this.resources.materials.forEach(material => material.dispose());
    
    this.resources.textures.clear();
    this.resources.geometries.clear();
    this.resources.materials.clear();
    this.resources.isLoaded = false;
    this.loadingPromise = null;
  }
}

export const earthPreloader = EarthPreloader.getInstance();