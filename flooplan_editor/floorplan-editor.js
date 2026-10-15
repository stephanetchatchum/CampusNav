(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // Existing traced walls, embedded directly from CampusMap.jsx's own
  // FLOOR_WALLS constant -- shown as a fixed, non-interactive reference
  // layer so new tracing can be calibrated against known-good geometry
  // already in the app, rather than eyeballed against an arbitrary number.
  const EXISTING_WALLS = {
    'Social Commons-2': [
      { points: [[272,682],[272,782],[527,783]] },
      { points: [[527,785],[530,793],[534,800],[541,805],[548,808],[556,809],[565,808],[572,805],[578,799],[583,792],[585,785],[586,776],[584,768],[579,761],[573,756],[566,752],[558,750]] },
      { points: [[555,753],[556,650]] },
      { points: [[89,189],[92,445]] },
      { points: [[271,681],[555,682]] },
    ],
    'Social Commons-1': [
      { points: [[223,54],[76,56],[78,654]] },
      { points: [[401,384],[403,627]] },
      { points: [[353,653],[78,653]] },
    ],
    'Social Commons-0': [
      { points: [[315,910],[315,337],[98,334],[98,151],[129,121],[167,150],[283,151]] },
      { points: [[313,696],[467,695]] },
    ],
  };

  const W = 820, H = 1000;

  // Per-floor working data: footprint is a single polygon (or null until
  // started), walls is an array of {points, smooth} objects matching the
  // exact format CampusMap.jsx's FLOOR_WALLS already expects.
  const floors = {
    'Social Commons-2': { footprint: null, walls: [] },
    'Social Commons-1': { footprint: null, walls: [] },
    'Social Commons-0': { footprint: null, walls: [] },
  };
  let currentFloorKey = 'Social Commons-2';

  let camera = { zoom: 1, panX: 0, panY: 0 };
  let tool = 'select'; // 'select' | 'footprint' | 'walls' | 'calibrate'
  let ref = null; // { src, w, h, px, py, scale, rotation }
  let alignMode = false;
  let calibration = { pxPerUnit: null };

  let activeChain = null; // points being actively placed for footprint or a wall segment
  let liveCursor = null; // current world-space cursor position, for live preview lines
  let shiftHeld = false;

  let calibPoints = null; // the two points clicked during calibration, before the number is entered
  let drag = null; // active pointer-drag state

  const svg = $('svg');
  const canvasArea = $('canvasArea');

  // ---- coordinate transforms ----
  // The SVG's own viewBox handles the base 820x1000 -> screen scaling
  // automatically; camera.zoom/pan are applied as an *additional* group
  // transform on top of that, so pointer math has to account for both.
  function screenToWorld(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const screenCTM = svg.getScreenCTM().inverse();
    const svgPoint = pt.matrixTransform(screenCTM); // now in the SVG's own 820x1000 space, before camera transform
    return {
      x: (svgPoint.x - camera.panX) / camera.zoom,
      y: (svgPoint.y - camera.panY) / camera.zoom,
    };
  }

  function applyOrthogonalSnap(start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    if (Math.abs(dx) > Math.abs(dy)) return { x: end.x, y: start.y };
    return { x: start.x, y: end.y };
  }

  function dist(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  // ---- rendering ----
  function render() {
    svg.innerHTML = '';
    const root = el('g', { transform: `translate(${camera.panX},${camera.panY}) scale(${camera.zoom})` });
    svg.appendChild(root);

    // Reference image, bottom layer
    if (ref && $('toggleRef').checked) {
      const opacity = $('refOpacity').value / 100;
      const tx = ref.px - ref.scale * ref.w / 2;
      const ty = ref.py - ref.scale * ref.h / 2;
      const transform = `translate(${tx},${ty}) scale(${ref.scale}) rotate(${ref.rotation}, ${ref.w / 2}, ${ref.h / 2})`;
      const img = el('image', { href: ref.src, x: 0, y: 0, width: ref.w, height: ref.h, opacity, transform, 'preserve-aspect-ratio': 'xMidYMid meet' });
      if (alignMode) img.setAttribute('class', 'refimg');
      if (alignMode) img.addEventListener('pointerdown', (e) => startDrag(e, { type: 'refimg' }));
      root.appendChild(img);
    }

    // Existing traced walls (known-good reference), light gray, non-interactive
    const existing = EXISTING_WALLS[currentFloorKey] || [];
    existing.forEach((w) => {
      root.appendChild(el('path', {
        d: pathD(w.points), fill: 'none', stroke: '#cbd5e1', 'stroke-width': 3,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '1 0',
      }));
    });

    const floorData = floors[currentFloorKey];

    // Footprint polygon (committed)
    if (floorData.footprint && floorData.footprint.length >= 3) {
      root.appendChild(el('polygon', {
        points: floorData.footprint.map((p) => p.join(',')).join(' '),
        fill: '#dbeafe', 'fill-opacity': 0.25, stroke: '#1d4ed8', 'stroke-width': 3, 'stroke-linejoin': 'round',
      }));
    }

    // Committed walls
    floorData.walls.forEach((w) => {
      root.appendChild(el('path', {
        d: pathD(w.points), fill: 'none', stroke: '#1e293b', 'stroke-width': 6,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
    });

    // Active chain being placed (footprint or a wall segment), plus live preview to cursor
    if (activeChain && activeChain.length > 0) {
      const previewColor = tool === 'footprint' ? '#1d4ed8' : '#1e293b';
      let d = `M ${activeChain[0].x} ${activeChain[0].y}`;
      for (let i = 1; i < activeChain.length; i++) d += ` L ${activeChain[i].x} ${activeChain[i].y}`;
      let previewEnd = liveCursor;
      if (previewEnd && shiftHeld && tool === 'walls') {
        previewEnd = applyOrthogonalSnap(activeChain[activeChain.length - 1], previewEnd);
      }
      if (previewEnd) d += ` L ${previewEnd.x} ${previewEnd.y}`;
      root.appendChild(el('path', { d, fill: 'none', stroke: previewColor, 'stroke-width': 3, 'stroke-dasharray': '5 4', opacity: 0.8 }));

      activeChain.forEach((p) => {
        root.appendChild(el('circle', { cx: p.x, cy: p.y, r: 4, fill: previewColor }));
      });

      // Live dimension label for the current wall segment being dragged out
      if (tool === 'walls' && previewEnd && activeChain.length > 0) {
        const last = activeChain[activeChain.length - 1];
        const lengthPx = dist(last, previewEnd);
        const label = calibration.pxPerUnit
          ? (lengthPx / calibration.pxPerUnit).toFixed(2) + ' u'
          : Math.round(lengthPx) + ' px';
        const mx = (last.x + previewEnd.x) / 2, my = (last.y + previewEnd.y) / 2;
        const t = el('text', { x: mx, y: my - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#1d4ed8', 'paint-order': 'stroke', stroke: 'white', 'stroke-width': 3 });
        t.textContent = label;
        root.appendChild(t);
      }
    }

    // Vertex handles for select tool
    if (tool === 'select') {
      if (floorData.footprint) {
        addVertexHandles(root, floorData.footprint, '#1d4ed8', 'footprint', null);
      }
      floorData.walls.forEach((w, wi) => {
        addVertexHandles(root, w.points, '#1e293b', 'wall', wi);
      });
    }

    updateStats();
  }

  function pathD(points) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) d += ` L ${points[i][0]} ${points[i][1]}`;
    return d;
  }

  function addVertexHandles(root, points, color, kind, wallIndex) {
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length];
      if (i < points.length - 1 || kind === 'footprint') {
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        const add = el('rect', {
          class: 'addpt', x: mx - 4, y: my - 4, width: 8, height: 8,
          fill: 'white', stroke: color, 'stroke-width': 1.5, transform: `rotate(45 ${mx} ${my})`,
        });
        add.addEventListener('click', () => {
          points.splice(i + 1, 0, [Math.round(mx), Math.round(my)]);
          render();
        });
        root.appendChild(add);
      }
    });
    points.forEach((p, i) => {
      const v = el('circle', { class: 'vertex', cx: p[0], cy: p[1], r: 6, fill: color, stroke: 'white', 'stroke-width': 2 });
      v.addEventListener('pointerdown', (e) => startDrag(e, { type: 'vertex', kind, wallIndex, i }));
      v.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const minPoints = kind === 'footprint' ? 3 : 2;
        if (points.length > minPoints) { points.splice(i, 1); render(); }
      });
      root.appendChild(v);
    });
  }

  function updateStats() {
    const fd = floors[currentFloorKey];
    $('footprintCount').textContent = fd.footprint ? fd.footprint.length : 0;
    $('wallCount').textContent = fd.walls.length;
  }

  // ---- dragging (vertices, reference image, camera pan) ----
  function startDrag(e, dragRef) {
    e.preventDefault();
    e.stopPropagation();
    svg.setPointerCapture(e.pointerId);
    drag = dragRef;
    drag.last = screenToWorld(e.clientX, e.clientY);
  }

  svg.addEventListener('pointerdown', (e) => {
    if (e.target !== svg) return; // vertex/image handlers already deal with their own targets
    if (tool === 'select') {
      startDrag(e, { type: 'pan' });
    } else if (tool === 'footprint') {
      const p = screenToWorld(e.clientX, e.clientY);
      if (!activeChain) activeChain = [];
      activeChain.push({ x: Math.round(p.x), y: Math.round(p.y) });
      render();
    } else if (tool === 'walls') {
      let p = screenToWorld(e.clientX, e.clientY);
      if (activeChain && activeChain.length && shiftHeld) {
        p = applyOrthogonalSnap(activeChain[activeChain.length - 1], p);
      }
      if (!activeChain) activeChain = [];
      activeChain.push({ x: Math.round(p.x), y: Math.round(p.y) });
      render();
    } else if (tool === 'calibrate') {
      const p = screenToWorld(e.clientX, e.clientY);
      if (!calibPoints) calibPoints = [];
      calibPoints.push(p);
      if (calibPoints.length === 2) showCalibInput();
      render();
    }
  });

  svg.addEventListener('pointermove', (e) => {
    liveCursor = screenToWorld(e.clientX, e.clientY);
    if (drag) {
      const p = screenToWorld(e.clientX, e.clientY);
      if (drag.type === 'vertex') {
        const fd = floors[currentFloorKey];
        const pts = drag.kind === 'footprint' ? fd.footprint : fd.walls[drag.wallIndex].points;
        pts[drag.i] = [Math.round(p.x), Math.round(p.y)];
      } else if (drag.type === 'refimg') {
        const [lx, ly] = [drag.last.x, drag.last.y];
        ref.px += (p.x - lx) * camera.zoom;
        ref.py += (p.y - ly) * camera.zoom;
        drag.last = p;
      } else if (drag.type === 'pan') {
        const dxScreen = (p.x - drag.last.x) * camera.zoom;
        const dyScreen = (p.y - drag.last.y) * camera.zoom;
        camera.panX += dxScreen;
        camera.panY += dyScreen;
        // drag.last stays in world space relative to the OLD camera, so
        // recompute it fresh next move rather than accumulate drift
        drag.last = screenToWorld(e.clientX, e.clientY);
      }
    }
    if (tool === 'walls' || tool === 'footprint') render(); // live preview line needs constant redraw
  });

  window.addEventListener('pointerup', () => { drag = null; });

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const screenX = e.clientX, screenY = e.clientY;
    const pt = svg.createSVGPoint();
    pt.x = screenX; pt.y = screenY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const worldBefore = { x: (svgP.x - camera.panX) / camera.zoom, y: (svgP.y - camera.panY) / camera.zoom };
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    camera.zoom = Math.max(0.2, Math.min(5, camera.zoom * zoomFactor));
    const worldAfter = { x: (svgP.x - camera.panX) / camera.zoom, y: (svgP.y - camera.panY) / camera.zoom };
    camera.panX += (worldAfter.x - worldBefore.x) * camera.zoom;
    camera.panY += (worldAfter.y - worldBefore.y) * camera.zoom;
    $('zoomLabel').textContent = Math.round(camera.zoom * 100) + '%';
    render();
  }, { passive: false });

  // ---- keyboard: shift for orthogonal snap, escape/enter to finish a chain, delete for selected ----
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') { shiftHeld = true; render(); }
    if (e.key === 'Escape' || e.key === 'Enter') {
      finishActiveChain();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') { shiftHeld = false; render(); }
  });

  svg.addEventListener('dblclick', (e) => {
    e.preventDefault();
    finishActiveChain();
  });

  function finishActiveChain() {
    if (!activeChain || activeChain.length < 2) { activeChain = null; render(); return; }
    const fd = floors[currentFloorKey];
    if (tool === 'footprint') {
      if (activeChain.length >= 3) {
        fd.footprint = activeChain.map((p) => [p.x, p.y]);
      }
    } else if (tool === 'walls') {
      fd.walls.push({ points: activeChain.map((p) => [p.x, p.y]), smooth: false });
    }
    activeChain = null;
    render();
  }

  // ---- calibration wizard ----
  function showCalibInput() {
    const [a, b] = calibPoints;
    const midScreenX = (a.x + b.x) / 2 * camera.zoom + camera.panX;
    const midScreenY = (a.y + b.y) / 2 * camera.zoom + camera.panY;
    const rect = canvasArea.getBoundingClientRect();
    const input = document.createElement('input');
    input.id = 'calibInput';
    input.placeholder = 'units';
    input.style.left = (rect.left + midScreenX) + 'px';
    input.style.top = (rect.top + midScreenY + 44) + 'px'; // offset for top bar
    document.body.appendChild(input);
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const realDistance = parseFloat(input.value);
        if (realDistance > 0) {
          const pxDistance = dist(a, b);
          calibration.pxPerUnit = pxDistance / realDistance;
          $('calibStat').textContent = calibration.pxPerUnit.toFixed(2) + ' px/unit';
          $('calibSection').style.display = 'block';
        }
        input.remove();
        calibPoints = null;
        setTool('select');
      } else if (e.key === 'Escape') {
        input.remove();
        calibPoints = null;
        render();
      }
    });
  }

  // ---- tool switching ----
  function setTool(t) {
    tool = t;
    activeChain = null;
    document.querySelectorAll('.toolBtn').forEach((b) => b.classList.remove('active'));
    const modePill = $('modePill');
    modePill.className = 'pill mode-' + t;
    const hint = $('hint');
    if (t === 'select') {
      $('toolSelect').classList.add('active');
      modePill.textContent = 'Select';
      hint.textContent = 'Drag a point to move it. Click a ◇ to add a point. Right-click a point to remove it.';
    } else if (t === 'footprint') {
      $('toolFootprint').classList.add('active');
      modePill.textContent = 'Footprint';
      hint.textContent = 'Click to place the building\u2019s outer corners in order. Press Enter or double-click to close the shape.';
    } else if (t === 'walls') {
      $('toolWalls').classList.add('active');
      modePill.textContent = 'Walls';
      hint.textContent = 'Click to start a wall, click again for each corner. Hold Shift for straight 90\u00b0 segments. Enter or double-click to finish this wall, then start the next one.';
    } else if (t === 'calibrate') {
      $('toolCalibrate').classList.add('active');
      modePill.textContent = 'Calibrate';
      hint.textContent = 'Click two points on the reference image that you know the real distance between, then type that distance.';
    }
    render();
  }

  $('toolSelect').addEventListener('click', () => setTool('select'));
  $('toolFootprint').addEventListener('click', () => setTool('footprint'));
  $('toolWalls').addEventListener('click', () => setTool('walls'));
  $('toolCalibrate').addEventListener('click', () => setTool('calibrate'));

  // ---- floor selector ----
  $('floorSelect').addEventListener('change', (e) => {
    currentFloorKey = e.target.value;
    activeChain = null;
    render();
  });

  // ---- reference image ----
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        const fitScale = Math.min(W / img.naturalWidth, H / img.naturalHeight) * 0.9;
        ref = { src: dataUrl, w: img.naturalWidth, h: img.naturalHeight, px: W / 2, py: H / 2, scale: fitScale, rotation: 0 };
        $('scaleSlider').value = Math.round(fitScale * 100);
        $('rotSlider').value = 0;
        $('toggleAlign').checked = true;
        alignMode = true;
        $('toggleRef').checked = true;
        render();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
  $('toggleRef').addEventListener('change', render);
  $('refOpacity').addEventListener('input', render);
  $('toggleAlign').addEventListener('change', (e) => { alignMode = e.target.checked; render(); });
  $('scaleSlider').addEventListener('input', (e) => { if (ref) { ref.scale = e.target.value / 100; render(); } });
  $('rotSlider').addEventListener('input', (e) => { if (ref) { ref.rotation = +e.target.value; render(); } });

  // ---- clear buttons ----
  $('clearFootprintBtn').addEventListener('click', () => {
    floors[currentFloorKey].footprint = null;
    render();
  });
  $('clearWallsBtn').addEventListener('click', () => {
    if (confirm('Clear all traced walls on this floor? This cannot be undone.')) {
      floors[currentFloorKey].walls = [];
      render();
    }
  });

  // ---- export: real coordinate code matching CampusMap.jsx's existing format, not an image ----
  $('exportBtn').addEventListener('click', () => {
    const fd = floors[currentFloorKey];
    let out = `// ${currentFloorKey}\n\n`;

    if (fd.footprint && fd.footprint.length >= 3) {
      out += `// Add to a FOOTPRINTS constant, or pass directly where getFloorFootprint is used:\nconst footprint_${currentFloorKey.replace(/[^a-zA-Z0-9]/g, '_')} = [\n`;
      out += fd.footprint.map((p) => `    [${p[0]}, ${p[1]}]`).join(',\n');
      out += '\n];\n\n';
    } else {
      out += '// No footprint traced yet on this floor.\n\n';
    }

    out += `// Merge these into FLOOR_WALLS['${currentFloorKey}']:\n`;
    if (fd.walls.length > 0) {
      out += fd.walls.map((w) =>
        `    { points: [${w.points.map((p) => `[${p[0]},${p[1]}]`).join(', ')}], smooth: ${w.smooth} },`
      ).join('\n');
    } else {
      out += '    // No new walls traced yet on this floor.';
    }
    out += '\n';

    $('codeOut').value = out;
  });

  $('copyBtn').addEventListener('click', () => {
    const ta = $('codeOut');
    ta.select();
    let ok = false;
    try { navigator.clipboard.writeText(ta.value); ok = true; } catch (e) {}
    if (!ok) { try { document.execCommand('copy'); ok = true; } catch (e) {} }
    $('copyStatus').textContent = ok ? 'Copied!' : 'Select text and press Ctrl/Cmd+C';
    setTimeout(() => { $('copyStatus').textContent = ''; }, 2000);
  });

  setTool('select');
  render();
})();