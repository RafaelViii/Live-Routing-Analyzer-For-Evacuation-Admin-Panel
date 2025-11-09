/* -------------------------------
  Setup: path coordinates (your array)
  - keeps exactly the coordinates you provided earlier
  ------------------------------- */
const path = [
  { left: 235, top: 75 },
  { left: 720, top: 75 },
  { left: 720, top: 258 },
  { left: 598, top: 258 },
  { left: 598, top: 458 },
  { left: 327, top: 458 },
  { left: 327, top: 565 },
  { left: 327, top: 428 },
  { left: 215, top: 428 },
  { left: 215, top: 205 },
  { left: 165, top: 205 },
  { left: 165, top: 130 },
  { left: 285, top: 130 }, 
  { left: 285, top: 75 }

];

// Center dots inside the 800x600 container dynamically
const containerWidth = 800;
const containerHeight = 600;

// 1. Find min/max of all current path positions
const minX = Math.min(...path.map(p => p.left));
const maxX = Math.max(...path.map(p => p.left));
const minY = Math.min(...path.map(p => p.top));
const maxY = Math.max(...path.map(p => p.top));

// 2. Compute the total width/height of the layout
const layoutWidth = maxX - minX;
const layoutHeight = maxY - minY;

// 3. Calculate centering offsets
const offsetX = (containerWidth - layoutWidth) / 2 - minX;
const offsetY = (containerHeight - layoutHeight) / 2 - minY;

// 4. Apply offsets to center all dots
path.forEach(p => {
  p.left += offsetX;
  p.top += offsetY;
});

// Fine-tune manual adjustment
const fineTuneX = 40;  // move right (+) or left (-)
const fineTuneY = 22;  // move up (-) or down (+)
path.forEach(p => {
  p.left += fineTuneX;
  p.top += fineTuneY;
});


// finish lines (kept from your earlier logic)
const finishLines = [
  { stepIndex: 2, pos: { left: 320, top: 570 } },
  { stepIndex: 0, pos: { left: 230, top: 70 } }
];

/* -------------------------------
  Dot generation settings
  - dots every ~10px along a segment
  - label a->z (reset for each segment)
  - maximum letter = 'z' (26)
  ------------------------------- */
const DOT_SPACING = 10; // px, desired spacing
const MAX_LABELS = 26; // a..z
const labels = "abcdefghijklmnopqrstuvwxyz".split("");

/* Data structure to store dots and blocks:
   dotsBySegment[i] = [ {el, x, y, label, blocked} ... ]
*/
const dotsBySegment = [];

/* Utility */
function dist(a,b) { return Math.hypot(a.left-b.left, a.top-b.top); }
function lerp(a,b,t,forceHV=false){
  let left = a.left + (b.left - a.left) * t;
  let top  = a.top  + (b.top  - a.top ) * t;

  if(forceHV){
    const dx = b.left - a.left;
    const dy = b.top - a.top;
    if(Math.abs(dx) > 0 && Math.abs(dy) === 0){ // horizontal
      top = a.top;
    } else if(Math.abs(dx) === 0 && Math.abs(dy) > 0){ // vertical
      left = a.left;
    } else {
      // diagonal detected; snap to horizontal first, then vertical
      // depending on your preference, here we can choose "first horizontal then vertical"
      // For simplicity, we snap horizontal first:
      top = a.top;
    }
  }

  return { left, top };
}


/* Create dots along each segment (i -> i+1) */
function createDotsForAllSegments(){
  // clear any existing dots first
  document.querySelectorAll('.dot').forEach(d=>d.remove());
  dotsBySegment.length = 0;

  // Create segments for all path points, including wrap-around (circular path)
  for(let i=0;i<path.length;i++){
    const start = path[i];
    const end   = path[(i+1) % path.length]; // wrap around for circular path
    const segmentLen = dist(start, end);
    // compute how many points: include both ends and space ~DOT_SPACING
    let count = Math.min(MAX_LABELS, Math.max(2, Math.round(segmentLen / DOT_SPACING) + 1));
    // ensure count doesn't exceed MAX_LABELS
    if(count > MAX_LABELS) count = MAX_LABELS;

    const arr = [];
    for(let k=0;k<count;k++){
      const t = (count===1) ? 0 : (k / (count - 1));
      const pos = lerp(start, end, t, true); // force horizontal/vertical
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = pos.left + 'px';
      dot.style.top = pos.top + 'px';
      const label = labels[Math.min(k, labels.length-1)];
      const labelEl = document.createElement('div');
      labelEl.className = 'label';
      labelEl.textContent = label;
       dot.appendChild(labelEl);

      // meta
      dot.dataset.segment = i;
      dot.dataset.index = k;
      dot.dataset.label = label;
      dot.dataset.blocked = "false";

      // click toggles blocked state
      dot.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleDotBlocked(i,k);
      });

      document.querySelector('.container').appendChild(dot);
      arr.push({ el: dot, x: pos.left, y: pos.top, label, blocked: false });
    }

    dotsBySegment.push(arr);
  }
}
// Create visual finish/exit markers
finishLines.forEach((f, idx) => {
  const div = document.createElement('div');
  div.className = 'finish';
  div.style.left = f.pos.left + 'px';
  div.style.top = f.pos.top + 'px';
  div.dataset.finishIndex = idx;
  document.querySelector('.container').appendChild(div);
});


/* Toggle dot blocked state by clicking */
function toggleDotBlocked(segmentIndex, dotIndex) {
  const dotMeta = dotsBySegment[segmentIndex][dotIndex];
  if(!dotMeta) return;
  dotMeta.blocked = !dotMeta.blocked;
  dotMeta.el.dataset.blocked = dotMeta.blocked ? "true" : "false";
  if(dotMeta.blocked) dotMeta.el.classList.add('blocked');
  else dotMeta.el.classList.remove('blocked');
}
// Create visual finish/exit markers
function createFinishMarkers() {
  finishLines.forEach((f, idx) => {
    const div = document.createElement('div');
    div.className = 'finish';
    div.style.left = f.pos.left + 'px';
    div.style.top = f.pos.top + 'px';
    div.dataset.finishIndex = idx;
    document.querySelector('.container').appendChild(div);
  });
}

// Call after dots creation
createFinishMarkers();


/* Reset all blocks */
function resetAllBlocks(){
  for(const seg of dotsBySegment){
    for(const d of seg){
      d.blocked = false;
      d.el.classList.remove('blocked');
      d.el.dataset.blocked = "false";
    }
  }
}

/* Find if any blocked dot exists between two positions on a given segment
   Given current ratio rCurr and next ratio rNext (both in 0..1), check
   if any dot at t in between is blocked.
*/
function blockedDotBetween(segmentIndex, rCurr, rNext){
  if(segmentIndex < 0 || segmentIndex >= dotsBySegment.length) return null;
  const segDots = dotsBySegment[segmentIndex];
  const low = Math.min(rCurr, rNext);
  const high = Math.max(rCurr, rNext);
  for(let i=0;i<segDots.length;i++){
    const t = (segDots.length===1) ? 0 : (i / (segDots.length - 1));
    if(t + 1e-9 >= low && t - 1e-9 <= high && segDots[i].blocked){
      return { segmentIndex, dotIndex: i, meta: segDots[i] };
    }
  }
  return null;
}

/* -------------------------------
  Rat movement variables and functions
  ------------------------------- */
const ratEl = document.getElementById('rat');
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const posOutput = document.getElementById('pos');
const stepOutput = document.getElementById('step');
const dirOutput = document.getElementById('dir');
const nbOutput = document.getElementById('nb');

let moving = false;
let step = 0;                  // current segment index (0 .. path.length-1, circular)
let ratioAlongSegment = 0;     // 0..1 position along current segment
let moveForward = true;        // direction along segments (true => + index)
const speed = 1.8;             // pixels per frame roughly (tuned later)

/* place rat on nearest path when starting */
function placeRatAtNearest() {
  // Get rat center
  const rect = ratEl.getBoundingClientRect();
  const containerRect = document.querySelector('.container').getBoundingClientRect();
  const ratX = rect.left + rect.width/2 - containerRect.left;
  const ratY = rect.top + rect.height/2 - containerRect.top;

  let bestSegment = 0;
  let bestT = 0;
  let bestDist = Infinity;

  // 1️⃣ Check all path segments
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i+1) % path.length]; // circular path
    const vx = b.left - a.left;
    const vy = b.top - a.top;
    const len2 = vx*vx + vy*vy;
    if(len2 === 0) continue;

    // Project rat onto segment
    let t = ((ratX - a.left) * vx + (ratY - a.top) * vy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.left + t*vx;
    const py = a.top + t*vy;
    const d = Math.hypot(px - ratX, py - ratY);

    if(d < bestDist) {
      bestDist = d;
      bestSegment = i;
      bestT = t;
    }
  }

  // 2️⃣ Check all finish lines as alternative "nearest"
  finishLines.forEach(f => {
    const d = Math.hypot(ratX - f.pos.left, ratY - f.pos.top);
    if(d < bestDist) {
      bestDist = d;
      // Snap to the nearest path segment but mark as finish
      bestSegment = null; // null indicates rat is on finish
      bestT = null;
      ratEl.style.left = f.pos.left + 'px';
      ratEl.style.top = f.pos.top + 'px';
    }
  });

  // 3️⃣ If not on finish, snap to path
  if(bestSegment !== null) {
    step = bestSegment;
    ratioAlongSegment = bestT;
    const p = lerp(path[step], path[(step+1) % path.length], ratioAlongSegment);
    ratEl.style.left = p.left + 'px';
    ratEl.style.top = p.top + 'px';
  }
}


/* Move one animation step (frame) */
function animateStep(){
  if(!moving) return;

  // compute current segment start/end (circular path)
  const start = path[step];
  const endIdx = moveForward ? ((step + 1) % path.length) : ((step - 1 + path.length) % path.length);
  const end = path[endIdx];

  const dx = end.left - start.left;
  const dy = end.top - start.top;
  const segLen = Math.hypot(dx, dy) || 1;

  // propose next ratio
  const deltaRatio = (speed / segLen) * (moveForward ? 1 : -1);
  const proposedRatio = ratioAlongSegment + deltaRatio;

  // before moving, check if a blocked dot lies between current ratio and proposedRatio on current segment (or on the logical segment if moving backward).
  // Determine the segment in dotsBySegment to check:
  let checkSegment = step;
  let rCurr = ratioAlongSegment;
  let rNext = proposedRatio;

  // special handling if moving backward onto previous segment: the 'segment' indices in dotsBySegment map to path segments i->i+1
  // When moving backward, we're still on segment (step-1)->step while step variable indicates current segment; to keep consistent with our generation (which used i->i+1),
  // we will interpret step as the index of the segment from path[step] to path[step+1] (same as dot generation). When moving reverse across boundary, logic below handles ratio crossing.
  // So just clamp checkSegment to [0 .. dotsBySegment.length-1]
  if(checkSegment < 0) checkSegment = (checkSegment + dotsBySegment.length) % dotsBySegment.length;
  if(checkSegment >= dotsBySegment.length) checkSegment = checkSegment % dotsBySegment.length;
  // Check if rat reached finish line
finishLines.forEach(f => {
  const pos = ratEl.getBoundingClientRect();
  const ratX = pos.left + pos.width/2 - document.querySelector('.container').getBoundingClientRect().left;
  const ratY = pos.top + pos.height/2 - document.querySelector('.container').getBoundingClientRect().top;

  const distToFinish = Math.hypot(ratX - f.pos.left, ratY - f.pos.top);
  if(distToFinish < 12){ // 12 = half of finish icon width
    moving = false;
    toggleBtn.textContent = "Finished!";
    console.log(`Rat reached finish line ${f.stepIndex}`);
  }
});



  // clamp rNext between -infty..infty for check; blockedDotBetween will use t in 0..1 region
  const blockedInfo = blockedDotBetween(checkSegment, rCurr, rNext);
  if(blockedInfo){
    // Found a blocked dot in path of the next step: reverse direction
    nbOutput.textContent = `Seg ${blockedInfo.segmentIndex} dot ${blockedInfo.meta.label} blocked`;
    // visually ensure it's blocked (already blocked)
    // Reverse direction
    moveForward = !moveForward;
    // Clear the block as requested when rat reroutes (reset)
    setTimeout(() => {
      blockedInfo.meta.blocked = false;
      blockedInfo.meta.el.classList.remove('blocked');
      blockedInfo.meta.el.dataset.blocked = "false";
    }, 1000); // small delay to visually show it was blocked briefly
    // don't move this frame (rat reverses and next frame moves)
    dirOutput.textContent = moveForward ? "forward" : "back";
    return requestAnimationFrame(animateStep);
  } else {
    nbOutput.textContent = "-";
  }

  // move ratio
  ratioAlongSegment = proposedRatio;

  // handle boundaries
  if(ratioAlongSegment >= 1 || ratioAlongSegment <= 0){
    // we've crossed to the next segment index
    if(moveForward){
      // advance to next segment (circular)
      ratioAlongSegment = ratioAlongSegment - 1;
      step = (step + 1) % path.length;
    } else {
      // moving backward (circular)
      ratioAlongSegment = ratioAlongSegment + 1;
      step = (step - 1 + path.length) % path.length;
    }
    // clamp ratio
    ratioAlongSegment = Math.max(0, Math.min(1, ratioAlongSegment));
  }
  function checkFinishReached() {
  const rect = ratEl.getBoundingClientRect();
  const containerRect = document.querySelector('.container').getBoundingClientRect();
  const ratX = rect.left + rect.width/2 - containerRect.left;
  const ratY = rect.top + rect.height/2 - containerRect.top;

  finishLines.forEach(f => {
    const dx = ratX - f.pos.left;
    const dy = ratY - f.pos.top;
    const distance = Math.hypot(dx, dy);

    if(distance < 12){ // 12px tolerance (half the icon size)
      moving = false;
      toggleBtn.textContent = "Finished!";
      console.log(`Rat reached finish line ${f.stepIndex}`);
    }
  });
}


  // set rat position (circular path)
  const pos = lerp(path[step], path[(step+1) % path.length], ratioAlongSegment);
  ratEl.style.left = pos.left + 'px';
  ratEl.style.top = pos.top + 'px';

  // update debug
  posOutput.textContent = `L:${Math.round(pos.left)}, T:${Math.round(pos.top)}`;
  stepOutput.textContent = `${step}`;
  dirOutput.textContent = moveForward ? "forward" : "back";

  // Request next frame
  requestAnimationFrame(animateStep);
}

/* Start / stop handlers */
toggleBtn.addEventListener('click', () => {
  moving = !moving;
  toggleBtn.textContent = moving ? "Stop" : "Start";
  if(moving){
    // find nearest path and place rat
    placeRatAtNearest();
    // ensure step index valid (circular path: 0 to path.length-1)
    if(step < 0) step = 0;
    if(step >= path.length) step = step % path.length;
    requestAnimationFrame(animateStep);
  }
});
resetBtn.addEventListener('click', () => {
  resetAllBlocks();
});

/* Drag rat with mouse while not moving */
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

ratEl.addEventListener('mousedown', (e) => {
  if(moving) return;
  isDragging = true;
  ratEl.style.cursor = 'grabbing';

// Compute offset between cursor and rat’s position
  const rect = ratEl.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  e.preventDefault(); // avoid text selection
});

document.addEventListener('mousemove', (e) => {
  if(!isDragging) return;
  const containerRect = document.querySelector('.container').getBoundingClientRect();
  let x = e.clientX - containerRect.left - dragOffsetX;
  let y = e.clientY - containerRect.top - dragOffsetY

  ratEl.style.left = x + 'px';
  ratEl.style.top = y + 'px';
});

document.addEventListener('mouseup', () => {
  if(!isDragging) return;
  isDragging = false;
  ratEl.style.cursor = 'grab';
});

/* init */ 
createDotsForAllSegments();
// place rat roughly at first path start
ratEl.style.left = path[0].left + 'px';
ratEl.style.top = path[0].top + 'px';