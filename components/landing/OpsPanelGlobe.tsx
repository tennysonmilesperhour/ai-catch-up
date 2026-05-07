"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  DEMO_SESSIONS,
  summariseSessions,
  type GlobeFeed,
  type GlobeSession,
} from "@/lib/globe-sessions";
import { LearnHint } from "@/components/shared/LearnMode";

const MARKER_COLOR: Record<GlobeSession["state"], number> = {
  active: 0x5fffd7, // cyan
  recent: 0xc084fc, // violet
  stale: 0x7d8aad,  // muted blue (deemphasized)
};

const MARKER_GLOW: Record<GlobeSession["state"], number> = {
  active: 0.75,
  recent: 0.45,
  stale: 0.25,
};

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export function OpsPanelGlobe() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [feed, setFeed] = useState<GlobeFeed>(() =>
    summariseSessions(DEMO_SESSIONS, "demo")
  );
  const sessionsRef = useRef<GlobeSession[]>(feed.sessions);

  // Keep sessionsRef in sync so the animation loop can read the latest
  // dataset without restarting the renderer.
  useEffect(() => {
    sessionsRef.current = feed.sessions;
  }, [feed.sessions]);

  // Register this visit, then pull the live feed. Re-pulls every 3 min
  // (was 60s, overkill for a low-traffic landing) and pauses entirely
  // when the tab is hidden so background tabs don't burn cycles.
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    async function ping() {
      try {
        await fetch("/api/sessions", {
          method: "POST",
          cache: "no-store",
        });
      } catch {
        /* ignore */
      }
    }
    async function pull() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<GlobeFeed>;
        if (cancelled || !json.sessions || json.sessions.length === 0) return;
        const next = summariseSessions(json.sessions, json.source ?? "live");
        setFeed(next);
      } catch {
        /* ignore, keep demo */
      }
    }
    function start() {
      stop();
      intervalId = setInterval(pull, 180_000);
    }
    function stop() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    }
    function onVis() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    ping().then(pull);
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ----- Setup -----
    const w = mount.clientWidth || 360;
    const h = mount.clientHeight || 360;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ----- Globe wireframe -----
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Lat/lon hairlines built explicitly so we control opacity/density.
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x5fffd7,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const RADIUS = 1.0;

    // Latitude rings.
    for (let i = 1; i < 12; i++) {
      const phi = (i / 12) * Math.PI;
      const r = Math.sin(phi) * RADIUS;
      const y = Math.cos(phi) * RADIUS;
      const points: THREE.Vector3[] = [];
      const seg = 64;
      for (let s = 0; s <= seg; s++) {
        const t = (s / seg) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      globeGroup.add(new THREE.Line(geo, lineMat));
    }
    // Longitude meridians.
    for (let j = 0; j < 18; j++) {
      const theta = (j / 18) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      const seg = 48;
      for (let s = 0; s <= seg; s++) {
        const phi = (s / seg) * Math.PI;
        const x = Math.sin(phi) * Math.cos(theta) * RADIUS;
        const y = Math.cos(phi) * RADIUS;
        const z = Math.sin(phi) * Math.sin(theta) * RADIUS;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      globeGroup.add(new THREE.Line(geo, lineMat));
    }

    // Subtle filled sphere behind the wireframe so back-side lines fade.
    const fillGeo = new THREE.SphereGeometry(RADIUS * 0.99, 48, 32);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x06101e,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
    });
    globeGroup.add(new THREE.Mesh(fillGeo, fillMat));

    // Outer halo ring (cyan equator-aligned faint glow).
    const haloGeo = new THREE.RingGeometry(RADIUS * 1.04, RADIUS * 1.06, 96);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x5fffd7,
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    scene.add(halo);

    // Dashed magenta orbit to keep the prototype's signature.
    const orbitPoints: THREE.Vector3[] = [];
    const ORBIT_R = RADIUS * 1.18;
    for (let s = 0; s <= 256; s++) {
      const t = (s / 256) * Math.PI * 2;
      orbitPoints.push(
        new THREE.Vector3(Math.cos(t) * ORBIT_R, 0, Math.sin(t) * ORBIT_R)
      );
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0xff5fb3,
      transparent: true,
      opacity: 0.55,
      dashSize: 0.08,
      gapSize: 0.06,
      depthWrite: false,
    });
    const orbit = new THREE.Line(orbitGeo, orbitMat);
    orbit.computeLineDistances();
    orbit.rotation.x = THREE.MathUtils.degToRad(-15);
    scene.add(orbit);

    // ----- Markers (lazy-rebuilt from sessionsRef each frame check) -----
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    let lastSessionsHash = "";
    function rebuildMarkers() {
      const sessions = sessionsRef.current;
      const hash = sessions.map((s) => s.id + s.state).join("|");
      if (hash === lastSessionsHash) return;
      lastSessionsHash = hash;
      // Dispose + clear.
      while (markersGroup.children.length) {
        const c = markersGroup.children.pop()!;
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
      }
      sessions.forEach((s) => {
        const v = latLonToVec3(s.lat, s.lon, RADIUS * 1.005);
        const color = MARKER_COLOR[s.state];
        // Core dot.
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 12, 12),
          new THREE.MeshBasicMaterial({ color })
        );
        core.position.copy(v);
        core.userData = { kind: "core", state: s.state };
        markersGroup.add(core);
        // Glow ring (opacity-modulated each frame for active markers).
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 12, 12),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: MARKER_GLOW[s.state],
            depthWrite: false,
          })
        );
        glow.position.copy(v);
        glow.userData = { kind: "glow", state: s.state, baseOpacity: MARKER_GLOW[s.state] };
        markersGroup.add(glow);
      });
    }
    rebuildMarkers();

    // ----- Animation loop -----
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = (now - start) / 1000;
      rebuildMarkers();
      if (!reduceMotion) {
        globeGroup.rotation.y = t * 0.06;
        orbit.rotation.y = -t * 0.03;
        // Pulse active glow rings.
        markersGroup.children.forEach((c) => {
          if (c.userData.kind === "glow" && c.userData.state === "active") {
            const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
            m.opacity =
              c.userData.baseOpacity *
              (0.55 + Math.sin(t * 2.4 + c.position.x * 4) * 0.45);
          }
        });
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // ----- Resize handling -----
    const ro = new ResizeObserver(() => {
      const nw = mount.clientWidth || 360;
      const nh = mount.clientHeight || 360;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      // Walk scene + dispose geometries/materials for memory cleanup.
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material | undefined)?.dispose();
        }
      });
    };
  }, []);

  const topCities = useMemo(
    () =>
      feed.sessions
        .filter((s) => s.state === "active")
        .slice(0, 3)
        .map((s) => s.city)
        .join(" · "),
    [feed.sessions]
  );

  return (
    <div className="glass-card-static ops-panel">
      <LearnHint
        title="Nexus · Live map"
        body="The 3D globe shows where people have logged in from in the last 24 hours. Each dot is one session; cyan = active in last 5 min, violet = recent, muted = stale."
        more={
          feed.source === "live"
            ? "Currently showing real Vercel-geolocated visits. Cold-start wipes the in-memory roster, so during low traffic this falls back to a curated demo dataset."
            : "Currently showing the curated demo dataset (23 cities across 18 countries). Switches to live the instant 3+ real visits register."
        }
        side="top-left"
      >
        <div className="ops-panel-head">
          <span>Nexus · Live map</span>
          <span className="live">
            <span className="dot" aria-hidden /> {feed.source === "live" ? "Live" : "Demo"}
          </span>
        </div>
      </LearnHint>

      <div className="globe-wrap globe-wrap-3d" ref={mountRef} aria-hidden />

      <div className="globe-stat-strip">
        <LearnHint
          title="Active now"
          body="Sessions registered in the last 5 minutes. Cyan core dots on the globe correspond to these."
          side="top-left"
        >
          <div className="cell">
            <span className="k">Active now</span>
            <span className="v num-tab">{feed.totals.active}</span>
          </div>
        </LearnHint>
        <LearnHint
          title="Recent (60 min)"
          body="Sessions registered in the last hour. Violet dots on the globe."
          side="top-left"
        >
          <div className="cell">
            <span className="k">Recent · 60m</span>
            <span className="v num-tab">{feed.totals.recent}</span>
          </div>
        </LearnHint>
        <LearnHint
          title="Countries"
          body="Distinct countries represented in the current roster (active + recent + stale combined)."
          side="top-right"
        >
          <div className="cell">
            <span className="k">Countries</span>
            <span className="v num-tab">{feed.totals.countries}</span>
          </div>
        </LearnHint>
      </div>

      {topCities && (
        <p className="globe-cities">
          Top live: <span>{topCities}</span>
        </p>
      )}
    </div>
  );
}
