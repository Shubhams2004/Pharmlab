import * as THREE from 'three';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';

interface ParsedAtom {
  x: number;
  y: number;
  z: number;
  element: string;
}

interface ParsedBond {
  a: number;
  b: number;
  order: number;
}

const CPK_COLORS: Record<string, number> = {
  H: 0xf8fafc,
  C: 0x334155,
  N: 0x2563eb,
  O: 0xdc2626,
  S: 0xeab308,
  P: 0xf97316,
  F: 0x22c55e,
  CL: 0x16a34a,
  BR: 0x991b1b,
  I: 0x7e22ce,
  FE: 0xd97706,
  MG: 0x10b981,
  CA: 0x14b8a6,
  ZN: 0x64748b,
  NA: 0x8b5cf6,
  K: 0xa855f7
};

const COVALENT_RADII: Record<string, number> = {
  H: 0.24,
  C: 0.36,
  N: 0.35,
  O: 0.34,
  S: 0.44,
  P: 0.44,
  F: 0.32,
  CL: 0.42,
  BR: 0.46,
  I: 0.5,
  FE: 0.48
};

function getCpkColor(element: string): number {
  return CPK_COLORS[element.toUpperCase()] ?? 0x38bdf8;
}

function getAtomRadius(element: string): number {
  return COVALENT_RADII[element.toUpperCase()] ?? 0.38;
}

function parseSdfOrMol(text: string): { atoms: ParsedAtom[]; bonds: ParsedBond[] } {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines.length < 4) {
    throw new Error('Invalid SDF/MOL file: header too short.');
  }

  // Locate counts line (contains V2000 or V3000, or standard line index 3)
  let countsIdx = 3;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (lines[i].includes('V2000') || lines[i].includes('V3000')) {
      countsIdx = i;
      break;
    }
  }

  const countsLine = lines[countsIdx] || '';
  const atoms: ParsedAtom[] = [];
  const bonds: ParsedBond[] = [];

  if (countsLine.includes('V3000')) {
    let mode: 'none' | 'atom' | 'bond' = 'none';
    for (let i = countsIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.startsWith('M  V30 BEGIN ATOM')) {
        mode = 'atom';
        continue;
      }
      if (l.startsWith('M  V30 END ATOM')) {
        mode = 'none';
        continue;
      }
      if (l.startsWith('M  V30 BEGIN BOND')) {
        mode = 'bond';
        continue;
      }
      if (l.startsWith('M  V30 END BOND')) {
        mode = 'none';
        continue;
      }
      if (mode === 'atom' && l.startsWith('M  V30 ')) {
        const parts = l.slice(7).trim().split(/\s+/);
        if (parts.length >= 6) {
          atoms.push({
            element: parts[1],
            x: parseFloat(parts[2]),
            y: parseFloat(parts[3]),
            z: parseFloat(parts[4])
          });
        }
      } else if (mode === 'bond' && l.startsWith('M  V30 ')) {
        const parts = l.slice(7).trim().split(/\s+/);
        if (parts.length >= 4) {
          bonds.push({
            order: parseInt(parts[1], 10) || 1,
            a: parseInt(parts[2], 10) - 1,
            b: parseInt(parts[3], 10) - 1
          });
        }
      }
    }
  } else {
    // V2000 fixed-width or whitespace fallback
    const atomCount = parseInt(countsLine.slice(0, 3).trim(), 10) || 0;
    const bondCount = parseInt(countsLine.slice(3, 6).trim(), 10) || 0;
    const atomStart = countsIdx + 1;

    for (let i = 0; i < atomCount; i++) {
      const line = lines[atomStart + i];
      if (!line) break;
      const parts = line.trim().split(/\s+/);
      const x = parseFloat(line.slice(0, 10)) || parseFloat(parts[0]);
      const y = parseFloat(line.slice(10, 20)) || parseFloat(parts[1]);
      const z = parseFloat(line.slice(20, 30)) || parseFloat(parts[2]);
      const element = (line.slice(31, 34).trim() || parts[3] || 'C').replace(/[^A-Za-z]/g, '');
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        atoms.push({ x, y, z, element: element || 'C' });
      }
    }

    const bondStart = atomStart + atomCount;
    for (let i = 0; i < bondCount; i++) {
      const line = lines[bondStart + i];
      if (!line) break;
      const a = (parseInt(line.slice(0, 3).trim(), 10) || 0) - 1;
      const b = (parseInt(line.slice(3, 6).trim(), 10) || 0) - 1;
      const order = parseInt(line.slice(6, 9).trim(), 10) || 1;
      if (a >= 0 && b >= 0 && a < atoms.length && b < atoms.length) {
        bonds.push({ a, b, order });
      }
    }
  }

  if (atoms.length === 0) {
    throw new Error('No 3D atomic coordinates found in this SDF/MOL file.');
  }

  return { atoms, bonds };
}

function createCylinderBetween(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radius: number,
  geo: THREE.CylinderGeometry,
  mat: THREE.Material
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.scale.set(radius, len, radius);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function buildMolecularGroupFromSdf(sdfText: string, label = 'Molecule'): THREE.Group {
  const { atoms, bonds } = parseSdfOrMol(sdfText);
  const group = new THREE.Group();
  group.name = label;

  const sphereGeo = new THREE.SphereGeometry(1, 24, 18);
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  const matCache = new Map<string, THREE.MeshStandardMaterial>();

  const getMat = (el: string) => {
    const key = el.toUpperCase();
    let m = matCache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: getCpkColor(key),
        roughness: 0.3,
        metalness: 0.08
      });
      matCache.set(key, m);
    }
    return m;
  };

  atoms.forEach((atom, idx) => {
    const r = getAtomRadius(atom.element);
    const mesh = new THREE.Mesh(sphereGeo, getMat(atom.element));
    mesh.position.set(atom.x, atom.y, atom.z);
    mesh.scale.setScalar(r);
    mesh.name = `Atom ${idx + 1} · ${atom.element}`;
    group.add(mesh);
  });

  const bondMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.15
  });

  const up = new THREE.Vector3(0, 1, 0);
  const alt = new THREE.Vector3(1, 0, 0);

  bonds.forEach((bond, idx) => {
    const a = atoms[bond.a];
    const b = atoms[bond.b];
    if (!a || !b) return;
    const p1 = new THREE.Vector3(a.x, a.y, a.z);
    const p2 = new THREE.Vector3(b.x, b.y, b.z);
    const axis = new THREE.Vector3().subVectors(p2, p1).normalize();
    const perp = new THREE.Vector3().crossVectors(
      axis,
      Math.abs(axis.dot(up)) > 0.9 ? alt : up
    ).normalize();

    if (bond.order === 2) {
      const off = perp.clone().multiplyScalar(0.08);
      const b1 = createCylinderBetween(
        p1.clone().add(off),
        p2.clone().add(off),
        0.055,
        cylGeo,
        bondMat
      );
      const b2 = createCylinderBetween(
        p1.clone().sub(off),
        p2.clone().sub(off),
        0.055,
        cylGeo,
        bondMat
      );
      b1.name = `Double Bond ${idx + 1}a`;
      b2.name = `Double Bond ${idx + 1}b`;
      group.add(b1, b2);
    } else if (bond.order >= 3) {
      const off = perp.clone().multiplyScalar(0.1);
      const b0 = createCylinderBetween(p1, p2, 0.048, cylGeo, bondMat);
      const b1 = createCylinderBetween(
        p1.clone().add(off),
        p2.clone().add(off),
        0.045,
        cylGeo,
        bondMat
      );
      const b2 = createCylinderBetween(
        p1.clone().sub(off),
        p2.clone().sub(off),
        0.045,
        cylGeo,
        bondMat
      );
      b0.name = `Triple Bond ${idx + 1}`;
      b1.name = `Triple Bond ${idx + 1}a`;
      b2.name = `Triple Bond ${idx + 1}b`;
      group.add(b0, b1, b2);
    } else {
      const b0 = createCylinderBetween(p1, p2, 0.085, cylGeo, bondMat);
      b0.name = `Bond ${idx + 1} (${a.element}-${b.element})`;
      group.add(b0);
    }
  });

  return group;
}

export function buildMacromoleculeGroupFromPdb(pdbText: string, label = 'Protein Structure'): THREE.Group {
  const loader = new PDBLoader();
  const pdb = loader.parse(pdbText);
  const atomGeo = pdb.geometryAtoms;
  const bondGeo = pdb.geometryBonds;

  const posAttr = atomGeo.getAttribute('position');
  const colAttr = atomGeo.getAttribute('color');
  if (!posAttr || posAttr.count === 0) {
    throw new Error('No 3D atomic coordinates found in this PDB file.');
  }

  const group = new THREE.Group();
  group.name = label;

  const count = posAttr.count;
  const sphereGeo = new THREE.SphereGeometry(0.42, count > 1200 ? 10 : 16, count > 1200 ? 8 : 12);
  const atomMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.08
  });

  const instAtoms = new THREE.InstancedMesh(sphereGeo, atomMat, count);
  instAtoms.name = `${label} · Atoms (${count})`;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    dummy.position.fromBufferAttribute(posAttr, i);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    instAtoms.setMatrixAt(i, dummy.matrix);
    if (colAttr) {
      color.fromBufferAttribute(colAttr, i);
      instAtoms.setColorAt(i, color);
    }
  }
  instAtoms.instanceMatrix.needsUpdate = true;
  if (instAtoms.instanceColor) instAtoms.instanceColor.needsUpdate = true;
  instAtoms.computeBoundingBox();
  instAtoms.computeBoundingSphere();
  group.add(instAtoms);

  const bondPos = bondGeo.getAttribute('position');
  if (bondPos && bondPos.count >= 2) {
    const bondSegments = bondPos.count / 2;
    const cylGeo = new THREE.CylinderGeometry(0.14, 0.14, 1, 6);
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.45,
      metalness: 0.1
    });
    const instBonds = new THREE.InstancedMesh(cylGeo, bondMat, bondSegments);
    instBonds.name = `${label} · Covalent Bonds (${bondSegments})`;

    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();

    for (let i = 0; i < bondSegments; i++) {
      p1.fromBufferAttribute(bondPos, i * 2);
      p2.fromBufferAttribute(bondPos, i * 2 + 1);
      dir.subVectors(p2, p1);
      const len = dir.length();
      if (len < 0.0001) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        instBonds.setMatrixAt(i, dummy.matrix);
        continue;
      }
      mid.copy(p1).addScaledVector(dir, 0.5);
      quat.setFromUnitVectors(up, dir.normalize());
      dummy.position.copy(mid);
      dummy.quaternion.copy(quat);
      dummy.scale.set(1, len, 1);
      dummy.updateMatrix();
      instBonds.setMatrixAt(i, dummy.matrix);
    }
    instBonds.instanceMatrix.needsUpdate = true;
    instBonds.computeBoundingBox();
    instBonds.computeBoundingSphere();
    group.add(instBonds);
  }

  return group;
}
