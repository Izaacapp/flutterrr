import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { flightService, Flight } from '../services/flight.service';
import { AIRPORT_COORDINATES } from '../data/airportCoordinates';
import { earthPreloader } from '../utils/earthPreloader';
import { useEarthResourcesReady } from '../hooks/useGlobalPreloader';
import '../assets/styles/Earth.css';

export const Earth: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameId = useRef<number | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const airplaneRef = useRef<THREE.Group | null>(null);
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const flightPathRef = useRef<THREE.Line | null>(null);
  const glowPathsRef = useRef<THREE.Line[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const viewStateRef = useRef<'middle' | 'origin' | 'destination'>('middle');
  const resourcesReady = useEarthResourcesReady();
  const [sceneInitialized, setSceneInitialized] = useState(false);

  // Distance calculator from D3 code
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: string = 'M'): number => {
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit === 'K') { dist = dist * 1.609344; }
    if (unit === 'N') { dist = dist * 0.8684; }
    return Math.round(dist);
  };


  // Convert lat/lon to 3D coordinates on sphere - CORRECTED
  const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    // Convert to radians
    const latRad = lat * (Math.PI / 180);
    const lonRad = -lon * (Math.PI / 180); // Negative for correct orientation
    
    // Spherical to Cartesian conversion
    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);
    
    return new THREE.Vector3(x, y, z);
  };

  // Create curved path between two points on sphere - Great Circle Arc
  const createCurvedPath = (start: THREE.Vector3, end: THREE.Vector3): THREE.CatmullRomCurve3 => {
    const points = [];
    const segments = 20;
    
    // Calculate great circle arc
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      
      // Project back onto sphere and lift for arc
      const altitude = 2.02 + (Math.sin(t * Math.PI) * 0.2); // Arc height
      point.normalize().multiplyScalar(altitude);
      
      points.push(point);
    }
    
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  };

  // Animate airplane along path
  const animateAirplane = (curve: THREE.CatmullRomCurve3, airplane: THREE.Group) => {
    // Cancel any existing animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    let progress = 0;
    const animate = () => {
      progress += 0.001; // Even slower for smooth movement
      if (progress > 1) progress = 0;
      
      const point = curve.getPoint(progress);
      const nextPoint = curve.getPoint((progress + 0.01) % 1);
      
      airplane.position.copy(point);
      airplane.lookAt(nextPoint);
      
      // Add continuous trail
      if (progress % 0.005 < 0.001) {
        const trailGeometry = new THREE.SphereGeometry(0.008, 6, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.copy(point);
        earthRef.current?.add(trail); // Add trail to earth so it rotates with it
        
        // Fade out trail
        let opacity = 0.8;
        const fadeTrail = () => {
          opacity -= 0.005;
          trailMaterial.opacity = opacity;
          if (opacity > 0) {
            requestAnimationFrame(fadeTrail);
          } else {
            earthRef.current?.remove(trail);
          }
        };
        fadeTrail();
      }
      
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    // Load user flights
    const loadFlights = async () => {
      try {
        const response = await flightService.getMyFlights();
        // Filter for completed flights on the frontend
        const completedFlights = response.flights.filter((f: Flight) => f.status === 'completed');
        setFlights(completedFlights);
      } catch (error) {
        console.error('Error loading flights:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFlights();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f3ff); // Passport Buddy light background
    sceneRef.current = scene;

    // Add starfield for space vibe
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starPositions.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xddd6fe, // Lighter purple for stars
      size: 0.08,
      transparent: true,
      opacity: 0.4
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8; // Zoomed out view
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Earth sphere - back to simple working version
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0xc4b5fd, // Light purple/lavender
      emissive: 0xe9d5ff,
      emissiveIntensity: 0.2,
      shininess: 50
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    
    // Calculate center of all flights to rotate Earth accordingly
    let avgLat = 0, avgLon = 0, flightCount = 0;
    flights.forEach(flight => {
      const originCoords = AIRPORT_COORDINATES[flight.origin.airportCode];
      const destCoords = AIRPORT_COORDINATES[flight.destination.airportCode];
      if (originCoords) {
        avgLat += originCoords.lat;
        avgLon += originCoords.lon;
        flightCount++;
      }
      if (destCoords) {
        avgLat += destCoords.lat;
        avgLon += destCoords.lon;
        flightCount++;
      }
    });
    
    if (flightCount > 0) {
      avgLat /= flightCount;
      avgLon /= flightCount;
      // Rotate Earth so flight center faces camera (rotate opposite direction to bring region forward)
      earth.rotation.y = -(avgLon * Math.PI / 180);
      earth.rotation.x = (avgLat * Math.PI / 180) * 0.3; // Slight tilt for latitude
    } else {
      earth.rotation.y = -Math.PI / 2; // Default: Americas face forward
    }
    
    scene.add(earth);
    earthRef.current = earth;
    
    // Add high quality Earth texture
    const textureLoader = new THREE.TextureLoader();
    
    // Load Earth day texture
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.color = new THREE.Color(0xffffff); // Reset color to show texture
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to NASA Blue Marble if the first texture fails
        textureLoader.load(
          'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74393/world.topo.200407.3x5400x2700.jpg',
          (texture) => {
            earthMaterial.map = texture;
            earthMaterial.color = new THREE.Color(0xffffff);
            earthMaterial.needsUpdate = true;
          }
        );
      }
    );
    
    // Add bump map for terrain
    textureLoader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
      (texture) => {
        earthMaterial.normalMap = texture;
        earthMaterial.normalScale = new THREE.Vector2(0.5, 0.5);
        earthMaterial.needsUpdate = true;
      }
    );

    // Add atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xddd6fe, // Light purple atmosphere
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // Flight paths group - attach to Earth so it rotates with it
    const flightPaths = new THREE.Group();
    earth.add(flightPaths); // Add to earth instead of scene

    // Create airplane using preloaded resources
    const airplaneGroup = new THREE.Group();
    const airplaneMaterial = earthPreloader.getMaterial('airplane');
    
    if (airplaneMaterial) {
      // Airplane body
      const bodyGeometry = earthPreloader.getGeometry('airplane_body');
      if (bodyGeometry) {
        const body = new THREE.Mesh(bodyGeometry, airplaneMaterial);
        body.rotation.z = Math.PI / 2;
        airplaneGroup.add(body);
      }
      
      // Wings
      const wingGeometry = earthPreloader.getGeometry('airplane_wing');
      if (wingGeometry) {
        const wings = new THREE.Mesh(wingGeometry, airplaneMaterial);
        airplaneGroup.add(wings);
      }
      
      // Tail
      const tailGeometry = earthPreloader.getGeometry('airplane_tail');
      if (tailGeometry) {
        const tail = new THREE.Mesh(tailGeometry, airplaneMaterial);
        tail.position.x = -0.03;
        airplaneGroup.add(tail);
      }
    }
    
    airplaneGroup.visible = false;
    earth.add(airplaneGroup); // Add to earth so it rotates with it
    airplaneRef.current = airplaneGroup;

    // Add airports and flight paths
    flights.forEach((flight) => {
      const originCoords = AIRPORT_COORDINATES[flight.origin.airportCode];
      const destCoords = AIRPORT_COORDINATES[flight.destination.airportCode];

      if (originCoords && destCoords) {
        // Airport markers - slightly above surface
        const originPos = latLonToVector3(originCoords.lat, originCoords.lon, 2.01);
        const destPos = latLonToVector3(destCoords.lat, destCoords.lon, 2.01);

        // Use preloaded airport markers
        const markerGeometry = earthPreloader.getGeometry('airport_marker');
        const originMaterial = earthPreloader.getMaterial('origin_marker');
        const destMaterial = earthPreloader.getMaterial('dest_marker');
        
        if (markerGeometry && originMaterial) {
          const originMarker = new THREE.Mesh(markerGeometry, originMaterial);
          originMarker.position.copy(originPos);
          flightPaths.add(originMarker);
        }

        if (markerGeometry && destMaterial) {
          const destMarker = new THREE.Mesh(markerGeometry, destMaterial);
          destMarker.position.copy(destPos);
          flightPaths.add(destMarker);
        }

        // Flight path with ultraviolet catastrophe vibe
        const curve = createCurvedPath(originPos, destPos);
        const points = curve.getPoints(100);
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create gradient effect with colors array
        const colors = [];
        const color1 = new THREE.Color(0xff00ff); // Magenta
        const color2 = new THREE.Color(0x4000ff); // Deep violet
        const color3 = new THREE.Color(0x0000ff); // Pure blue (UV edge)
        
        for (let i = 0; i < points.length; i++) {
          const t = i / (points.length - 1);
          let color;
          if (t < 0.5) {
            color = new THREE.Color().lerpColors(color1, color2, t * 2);
          } else {
            color = new THREE.Color().lerpColors(color2, color3, (t - 0.5) * 2);
          }
          // Add intensity variation
          const intensity = 0.7 + Math.sin(t * Math.PI) * 0.3;
          color.multiplyScalar(intensity);
          colors.push(color.r, color.g, color.b);
        }
        
        pathGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const pathMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          opacity: 0.8,
          transparent: true,
          linewidth: 2,
          blending: THREE.AdditiveBlending
        });
        const flightPath = new THREE.Line(pathGeometry, pathMaterial);
        flightPaths.add(flightPath);
        
        // Add glow effect with additional line
        const glowMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          opacity: 0.3,
          transparent: true,
          linewidth: 4,
          blending: THREE.AdditiveBlending
        });
        const glowPath = new THREE.Line(pathGeometry.clone(), glowMaterial);
        flightPaths.add(glowPath);
      }
    });

    // Animation
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      earth.rotation.y -= 0.0003; // Much slower rotation, reversed direction
      if (atmosphereRef.current) {
        atmosphereRef.current.rotation.y += 0.0004;
      }
      
      // Rotate stars slowly
      if (sceneRef.current) {
        const stars = sceneRef.current.children.find(child => child instanceof THREE.Points);
        if (stars) {
          stars.rotation.y += 0.0001;
        }
      }
      
      // Smooth camera movement (disabled during manual positioning)
      if (cameraTargetRef.current && viewStateRef.current === 'middle' && !selectedFlight) {
        camera.position.lerp(cameraTargetRef.current, 0.05);
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);
    
    // Call resize immediately to ensure proper initial size
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [flights]);

  return (
    <div className="earth-container">
      <div className="earth-header">
        <h1>Flight Earth View</h1>
        <div className="earth-stats">
          <div className="stat">
            <span className="stat-value">{flights.length}</span>
            <span className="stat-label">Flights</span>
          </div>
          {selectedFlight && distance && (
            <div className="stat">
              <span className="stat-value">{distance.toLocaleString()}</span>
              <span className="stat-label">Miles</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="earth-canvas" ref={mountRef} />
      
      <div className="flight-list">
        <h3>Your Flights</h3>
        {loading ? (
          <p>Loading flights...</p>
        ) : (
          <div className="flight-items">
            {flights.map(flight => {
              const originCoords = AIRPORT_COORDINATES[flight.origin.airportCode];
              const destCoords = AIRPORT_COORDINATES[flight.destination.airportCode];
              const dist = originCoords && destCoords 
                ? calcDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon, 'M')
                : 0;
              
              return (
                <div 
                  key={flight._id} 
                  className={`flight-item ${selectedFlight?._id === flight._id ? 'selected' : ''}`}
                  onClick={() => {
                    const originCoords = AIRPORT_COORDINATES[flight.origin.airportCode];
                    const destCoords = AIRPORT_COORDINATES[flight.destination.airportCode];
                    
                    if (!originCoords || !destCoords) return;
                    
                    const originPos = latLonToVector3(originCoords.lat, originCoords.lon, 2.02);
                    const destPos = latLonToVector3(destCoords.lat, destCoords.lon, 2.02);
                    
                    // If clicking same flight, cycle through views
                    if (selectedFlight?._id === flight._id) {
                      // Cycle: middle → origin → destination → middle
                      if (viewStateRef.current === 'middle') {
                        viewStateRef.current = 'origin';
                      } else if (viewStateRef.current === 'origin') {
                        viewStateRef.current = 'destination';
                      } else {
                        viewStateRef.current = 'middle';
                      }
                    } else {
                      // New flight selected, start at middle
                      setSelectedFlight(flight);
                      setDistance(dist);
                      viewStateRef.current = 'middle';
                      
                      // Create flight path visualization
                      if (airplaneRef.current && sceneRef.current) {
                        const curve = createCurvedPath(originPos, destPos);
                        
                        // Remove old flight path and glow paths if exist
                        if (flightPathRef.current && earthRef.current) {
                          earthRef.current.remove(flightPathRef.current);
                        }
                        glowPathsRef.current.forEach(path => {
                          if (earthRef.current) {
                            earthRef.current.remove(path);
                          }
                        });
                        glowPathsRef.current = [];
                        
                        // Create intense ultraviolet catastrophe path for selected flight
                        const points = curve.getPoints(100);
                        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
                        
                        // More intense UV gradient for selected path
                        const colors = [];
                        const color1 = new THREE.Color(0xff00ff); // Hot magenta
                        const color2 = new THREE.Color(0x8000ff); // Electric violet
                        const color3 = new THREE.Color(0x0080ff); // UV blue
                        const color4 = new THREE.Color(0x00ffff); // Cyan (extreme UV)
                        
                        for (let i = 0; i < points.length; i++) {
                          const t = i / (points.length - 1);
                          let color;
                          if (t < 0.33) {
                            color = new THREE.Color().lerpColors(color1, color2, t * 3);
                          } else if (t < 0.67) {
                            color = new THREE.Color().lerpColors(color2, color3, (t - 0.33) * 3);
                          } else {
                            color = new THREE.Color().lerpColors(color3, color4, (t - 0.67) * 3);
                          }
                          // Pulsing intensity
                          const intensity = 0.8 + Math.sin(t * Math.PI * 2) * 0.2;
                          color.multiplyScalar(intensity * 1.5); // Brighter for selected
                          colors.push(color.r, color.g, color.b);
                        }
                        
                        pathGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                        
                        const pathMaterial = new THREE.LineBasicMaterial({
                          vertexColors: true,
                          opacity: 1,
                          transparent: true,
                          linewidth: 4,
                          blending: THREE.AdditiveBlending
                        });
                        const activePath = new THREE.Line(pathGeometry, pathMaterial);
                        earthRef.current?.add(activePath);
                        flightPathRef.current = activePath;
                        
                        // Add intense glow layers
                        const glowGeometry = pathGeometry.clone();
                        const glowMaterial1 = new THREE.LineBasicMaterial({
                          vertexColors: true,
                          opacity: 0.4,
                          transparent: true,
                          linewidth: 8,
                          blending: THREE.AdditiveBlending
                        });
                        const glowPath1 = new THREE.Line(glowGeometry, glowMaterial1);
                        earthRef.current?.add(glowPath1);
                        glowPathsRef.current.push(glowPath1);
                        
                        const glowMaterial2 = new THREE.LineBasicMaterial({
                          vertexColors: true,
                          opacity: 0.2,
                          transparent: true,
                          linewidth: 12,
                          blending: THREE.AdditiveBlending
                        });
                        const glowPath2 = new THREE.Line(glowGeometry.clone(), glowMaterial2);
                        earthRef.current?.add(glowPath2);
                        glowPathsRef.current.push(glowPath2);
                        
                        airplaneRef.current.visible = true;
                        animateAirplane(curve, airplaneRef.current);
                      }
                    }
                    
                    // Move camera based on current view state
                    if (cameraRef.current && controlsRef.current) {
                      controlsRef.current.autoRotate = false;
                      
                      let targetPos;
                      const zoomDistance = 3.5;
                      
                      switch (viewStateRef.current) {
                        case 'origin':
                          targetPos = originPos.clone().normalize().multiplyScalar(zoomDistance);
                          break;
                        case 'destination':
                          targetPos = destPos.clone().normalize().multiplyScalar(zoomDistance);
                          break;
                        case 'middle':
                        default:
                          // Position camera to see both points
                          const midPoint = new THREE.Vector3().addVectors(originPos, destPos).multiplyScalar(0.5);
                          targetPos = midPoint.normalize().multiplyScalar(zoomDistance);
                          break;
                      }
                      
                      // Animate camera to new position
                      const startPos = cameraRef.current.position.clone();
                      const startTarget = controlsRef.current.target.clone();
                      const endTarget = new THREE.Vector3(0, 0, 0);
                      
                      let progress = 0;
                      const animateCamera = () => {
                        progress += 0.03;
                        if (progress <= 1) {
                          cameraRef.current!.position.lerpVectors(startPos, targetPos, progress);
                          controlsRef.current.target.lerpVectors(startTarget, endTarget, progress);
                          controlsRef.current.update();
                          requestAnimationFrame(animateCamera);
                        }
                      };
                      animateCamera();
                    }
                  }}
                >
                  <div className="flight-route">
                    {flight.origin.airportCode} → {flight.destination.airportCode}
                  </div>
                  <div className="flight-details">
                    {flight.airline} {flight.flightNumber} • {dist} miles
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};