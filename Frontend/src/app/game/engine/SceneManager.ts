import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  private environmentObjects: Map<string, THREE.Object3D> = new Map();
  private staticObjects: THREE.Mesh[] = [];
  private dynamicObjects: THREE.Object3D[] = [];
  private collisionMeshes: THREE.Mesh[] = [];

  private fogColor: THREE.Color = new THREE.Color(0x1a0a0a);
  private fogDensity: number = 0.025;

  initialize(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.setupScene();
  }

  private setupScene(): void {
    if (!this.scene) return;

    this.scene.background = this.fogColor;
    this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);

    this.createSkybox();
  }

  private createSkybox(): void {
    if (!this.scene) return;

    const starCount = 5000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        starColors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      } else if (colorChoice < 0.8) {
        starColors[i * 3] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
        starColors[i * 3 + 2] = 0.5 + Math.random() * 0.5;
      }

      starSizes[i] = 0.2 + Math.random() * 0.8;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = 'skybox_stars';
    this.scene!.add(stars);
    this.environmentObjects.set('stars', stars);

    const moonGeometry = new THREE.SphereGeometry(8, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0.9,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(80, 120, -80);
    moon.name = 'skybox_moon';
    this.scene!.add(moon);
    this.environmentObjects.set('moon', moon);

    const moonLight = new THREE.PointLight(0xffffdd, 0.3, 300);
    moonLight.position.copy(moon.position);
    moonLight.name = 'skybox_moon_light';
    this.scene!.add(moonLight);
    this.environmentObjects.set('moon_light', moonLight);
  }

  public addEnvironmentObject(name: string, object: THREE.Object3D): void {
    if (!this.scene) return;
    this.environmentObjects.set(name, object);
    this.scene.add(object);
  }

  public removeEnvironmentObject(name: string): void {
    const object = this.environmentObjects.get(name);
    if (object && this.scene) {
      this.scene.remove(object);
      this.disposeObject(object);
      this.environmentObjects.delete(name);
    }
  }

  public getEnvironmentObject(name: string): THREE.Object3D | undefined {
    return this.environmentObjects.get(name);
  }

  public addStaticObject(mesh: THREE.Mesh): void {
    this.staticObjects.push(mesh);
    if (this.scene) {
      this.scene.add(mesh);
    }
  }

  public addDynamicObject(object: THREE.Object3D): void {
    this.dynamicObjects.push(object);
    if (this.scene) {
      this.scene.add(object);
    }
  }

  public addCollisionMesh(mesh: THREE.Mesh): void {
    this.collisionMeshes.push(mesh);
    if (this.scene) {
      this.scene.add(mesh);
    }
  }

  public getCollisionMeshes(): THREE.Mesh[] {
    return this.collisionMeshes;
  }

  public removeCollisionMesh(mesh: THREE.Mesh): void {
    const index = this.collisionMeshes.indexOf(mesh);
    if (index !== -1) {
      this.collisionMeshes.splice(index, 1);
      if (this.scene) {
        this.scene.remove(mesh);
      }
      this.disposeObject(mesh);
    }
  }

  public setFog(color: THREE.Color, density: number): void {
    this.fogColor = color;
    this.fogDensity = density;
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(color, density);
      this.scene.background = color;
    }
  }

  public setFogColor(color: THREE.Color): void {
    this.fogColor = color;
    if (this.scene) {
      this.scene.background = color;
      if (this.scene.fog instanceof THREE.FogExp2) {
        (this.scene.fog as THREE.FogExp2).color = color;
      }
    }
  }

  public setFogDensity(density: number): void {
    this.fogDensity = density;
    if (this.scene && this.scene.fog instanceof THREE.FogExp2) {
      (this.scene.fog as THREE.FogExp2).density = density;
    }
  }

  public createLevelGeometry(levelData: any): void {
    if (!this.scene) return;

    this.clearLevelGeometry();

    if (levelData.floor) {
      this.createFloor(levelData.floor);
    }

    if (levelData.walls) {
      this.createWalls(levelData.walls);
    }

    if (levelData.ceilings) {
      this.createCeilings(levelData.ceilings);
    }

    if (levelData.props) {
      this.createProps(levelData.props);
    }
  }

  private createFloor(floorData: any): void {
    const geometry = new THREE.PlaneGeometry(floorData.width, floorData.depth, floorData.segments || 1);
    const material = new THREE.MeshStandardMaterial({
      color: floorData.color || 0x2a1a1a,
      roughness: floorData.roughness || 0.9,
      metalness: floorData.metalness || 0.1,
      map: floorData.texture,
      normalMap: floorData.normalMap,
      roughnessMap: floorData.roughnessMap,
      aoMap: floorData.aoMap,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(floorData.x || 0, floorData.y || 0, floorData.z || 0);
    floor.receiveShadow = true;
    floor.castShadow = true;
    floor.name = 'level_floor';

    this.addStaticObject(floor);

    if (floorData.collision !== false) {
      const collisionGeometry = new THREE.BoxGeometry(floorData.width, 0.1, floorData.depth);
      const collisionMesh = new THREE.Mesh(
        collisionGeometry,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      collisionMesh.position.copy(floor.position);
      collisionMesh.rotation.copy(floor.rotation);
      this.addCollisionMesh(collisionMesh);
    }
  }

  private createWalls(wallsData: any[]): void {
    wallsData.forEach((wallData, index) => {
      const geometry = new THREE.BoxGeometry(
        wallData.width || 10,
        wallData.height || 4,
        wallData.thickness || 0.3
      );
      const material = new THREE.MeshStandardMaterial({
        color: wallData.color || 0x3a2a2a,
        roughness: wallData.roughness || 0.8,
        metalness: wallData.metalness || 0.2,
        map: wallData.texture,
        normalMap: wallData.normalMap,
      });

      const wall = new THREE.Mesh(geometry, material);
      wall.position.set(wallData.x || 0, wallData.y || 0, wallData.z || 0);
      wall.rotation.set(wallData.rx || 0, wallData.ry || 0, wallData.rz || 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = `level_wall_${index}`;

      this.addStaticObject(wall);

      if (wallData.collision !== false) {
        const collisionMesh = new THREE.Mesh(
          geometry.clone(),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        collisionMesh.position.copy(wall.position);
        collisionMesh.rotation.copy(wall.rotation);
        this.addCollisionMesh(collisionMesh);
      }
    });
  }

  private createCeilings(ceilingsData: any[]): void {
    ceilingsData.forEach((ceilingData, index) => {
      const geometry = new THREE.PlaneGeometry(ceilingData.width, ceilingData.depth);
      const material = new THREE.MeshStandardMaterial({
        color: ceilingData.color || 0x2a2a2a,
        roughness: ceilingData.roughness || 0.9,
        metalness: ceilingData.metalness || 0.1,
        side: THREE.DoubleSide,
        map: ceilingData.texture,
      });

      const ceiling = new THREE.Mesh(geometry, material);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(ceilingData.x || 0, ceilingData.y || 4, ceilingData.z || 0);
      ceiling.receiveShadow = true;
      ceiling.name = `level_ceiling_${index}`;

      this.addStaticObject(ceiling);
    });
  }

  private createProps(propsData: any[]): void {
    propsData.forEach((propData, index) => {
      const geometry = this.createPropGeometry(propData.type, propData.size);
      const material = new THREE.MeshStandardMaterial({
        color: propData.color || 0x888888,
        roughness: propData.roughness || 0.7,
        metalness: propData.metalness || 0.2,
        map: propData.texture,
        normalMap: propData.normalMap,
      });

      const prop = new THREE.Mesh(geometry, material);
      prop.position.set(propData.x || 0, propData.y || 0, propData.z || 0);
      prop.rotation.set(propData.rx || 0, propData.ry || 0, propData.rz || 0);
      prop.scale.set(propData.scaleX || 1, propData.scaleY || 1, propData.scaleZ || 1);
      prop.castShadow = true;
      prop.receiveShadow = true;
      prop.name = `level_prop_${index}`;

      if (propData.dynamic) {
        this.addDynamicObject(prop);
      } else {
        this.addStaticObject(prop);
      }

      if (propData.collision !== false) {
        const collisionGeometry = geometry.clone();
        const collisionMesh = new THREE.Mesh(
          collisionGeometry,
          new THREE.MeshBasicMaterial({ visible: false })
        );
        collisionMesh.position.copy(prop.position);
        collisionMesh.rotation.copy(prop.rotation);
        collisionMesh.scale.copy(prop.scale);
        this.addCollisionMesh(collisionMesh);
      }
    });
  }

  private createPropGeometry(type: string, size: number = 1): THREE.BufferGeometry {
    switch (type) {
      case 'crate':
        return new THREE.BoxGeometry(size, size, size);
      case 'barrel':
        return new THREE.CylinderGeometry(size * 0.4, size * 0.4, size * 1.2, 12);
      case 'pillar':
        return new THREE.CylinderGeometry(size * 0.5, size * 0.5, size * 3, 12);
      case 'pipe':
        return new THREE.CylinderGeometry(size * 0.1, size * 0.1, size * 5, 8);
      case 'console':
        return new THREE.BoxGeometry(size * 1.5, size * 1, size * 0.8);
      case 'locker':
        return new THREE.BoxGeometry(size * 0.8, size * 2, size * 0.6);
      case 'table':
        return new THREE.BoxGeometry(size * 2, size * 0.1, size * 1.2);
      case 'chair':
        return new THREE.BoxGeometry(size * 0.6, size * 1, size * 0.6);
      case 'monitor':
        return new THREE.BoxGeometry(size * 0.8, size * 0.5, size * 0.1);
      case 'keyboard':
        return new THREE.BoxGeometry(size * 0.5, size * 0.05, size * 0.2);
      case 'medkit':
        return new THREE.BoxGeometry(size * 0.3, size * 0.1, size * 0.2);
      case 'ammo_box':
        return new THREE.BoxGeometry(size * 0.4, size * 0.2, size * 0.3);
      default:
        return new THREE.BoxGeometry(size, size, size);
    }
  }

  public clearLevelGeometry(): void {
    this.staticObjects.forEach(obj => {
      if (this.scene) this.scene.remove(obj);
      this.disposeObject(obj);
    });
    this.staticObjects = [];

    this.dynamicObjects.forEach(obj => {
      if (this.scene) this.scene.remove(obj);
      this.disposeObject(obj);
    });
    this.dynamicObjects = [];

    this.collisionMeshes.forEach(mesh => {
      if (this.scene) this.scene.remove(mesh);
      this.disposeObject(mesh);
    });
    this.collisionMeshes = [];
  }

  public update(deltaTime: number): void {
    this.dynamicObjects.forEach(obj => {
      if (obj.userData.update) {
        obj.userData.update(deltaTime);
      }
    });

    if (this.environmentObjects.has('stars')) {
      const stars = this.environmentObjects.get('stars') as THREE.Points;
      if (stars) {
        stars.rotation.y += deltaTime * 0.0001;
      }
    }
  }

  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 100): THREE.Intersection[] {
    if (!this.scene) return [];

    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance);
    const objects = [...this.staticObjects, ...this.dynamicObjects];
    return raycaster.intersectObjects(objects, true);
  }

  public raycastCollision(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 100): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance);
    return raycaster.intersectObjects(this.collisionMeshes, true);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => material.dispose());
        }
      }
    });
  }

  public clear(): void {
    this.clearLevelGeometry();

    this.environmentObjects.forEach((object, name) => {
      if (this.scene) this.scene.remove(object);
      this.disposeObject(object);
    });
    this.environmentObjects.clear();

    if (this.scene) {
      while (this.scene.children.length > 0) {
        const child = this.scene.children[0];
        this.scene.remove(child);
        this.disposeObject(child);
      }
    }
  }

  public dispose(): void {
    this.clear();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  public getScene(): THREE.Scene | null {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }
}