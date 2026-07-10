// Thin wrapper around @mediapipe/hands that turns raw landmarks into the
// events the booth cares about: hand count, thumbs-up, open-palm, swipe, pinch.

const FINGER_TIPS = [4, 8, 12, 16, 20];
const FINGER_PIPS = [3, 6, 10, 14, 18];

function dist(a, b){
  return Math.hypot(a.x-b.x, a.y-b.y, (a.z||0)-(b.z||0));
}

// A finger counts as "extended" if its tip is farther from the wrist than its pip joint.
function extendedFingers(landmarks){
  const wrist = landmarks[0];
  const out = [];
  for(let i=0;i<5;i++){
    const tip = landmarks[FINGER_TIPS[i]];
    const pip = landmarks[FINGER_PIPS[i]];
    out.push(dist(tip, wrist) > dist(pip, wrist) * 1.08);
  }
  return out; // [thumb, index, middle, ring, pinky]
}

function isOpenPalm(landmarks){
  const ext = extendedFingers(landmarks);
  return ext.filter(Boolean).length >= 4;
}

function isThumbsUp(landmarks){
  const ext = extendedFingers(landmarks);
  const [thumb, index, middle, ring, pinky] = ext;
  const thumbTip = landmarks[4], wrist = landmarks[0];
  const thumbUp = thumbTip.y < wrist.y - 0.08; // tip clearly above wrist in image space
  return thumb && thumbUp && !index && !middle && !ring && !pinky;
}

function isPinch(landmarks){
  const d = dist(landmarks[4], landmarks[8]);
  return d < 0.045;
}

export class HandTracker{
  /**
   * @param {HTMLVideoElement} videoEl
   * @param {(state: TrackState)=>void} onUpdate
   */
  constructor(videoEl, onUpdate){
    this.video = videoEl;
    this.onUpdate = onUpdate;
    this.hands = null;
    this.running = false;
    this._swipeHistory = []; // recent wrist x positions with timestamps
    this._lastSwipeAt = 0;
    this._openPalmSince = null;
    this._twoHandSince = null;
    this._thumbsSince = null;
  }

  async init(){
    // eslint-disable-next-line no-undef
    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    this.hands.onResults((results) => this._handleResults(results));
    await this.hands.initialize();
  }

  start(){
    if(this.running) return;
    this.running = true;
    this._loop();
  }

  stop(){ this.running = false; }

  async _loop(){
    if(!this.running) return;
    if(this.video.readyState >= 2){
      try{ await this.hands.send({image: this.video}); }catch(e){ /* ignore transient frame errors */ }
    }
    requestAnimationFrame(() => this._loop());
  }

  _handleResults(results){
    const now = performance.now();
    const list = results.multiHandLandmarks || [];
    const count = list.length;

    let anyOpenPalm = false;
    let anyThumbsUp = false;
    let anyPinch = false;
    let wristX = null;

    list.forEach(landmarks => {
      if(isOpenPalm(landmarks)) anyOpenPalm = true;
      if(isThumbsUp(landmarks)) anyThumbsUp = true;
      if(isPinch(landmarks)) anyPinch = true;
      wristX = landmarks[0].x;
    });

    // persistence gating to avoid single-frame flicker
    const twoHandsStable = this._gate('twoHands', count === 2, now, 260);
    const openPalmStable = this._gate('openPalm', anyOpenPalm, now, 200);
    const thumbsUpStable = this._gate('thumbsUp', anyThumbsUp, now, 260);

    // swipe detection based on single-hand wrist x movement over ~350ms
    let swipe = null;
    if(count === 1 && wristX != null){
      this._swipeHistory.push({x: wristX, t: now});
      this._swipeHistory = this._swipeHistory.filter(p => now - p.t < 350);
      if(this._swipeHistory.length > 3 && now - this._lastSwipeAt > 700){
        const first = this._swipeHistory[0];
        const dx = wristX - first.x;
        if(Math.abs(dx) > 0.22){
          swipe = dx > 0 ? 'right' : 'left';
          this._lastSwipeAt = now;
          this._swipeHistory = [];
        }
      }
    } else {
      this._swipeHistory = [];
    }

    this.onUpdate({
      count,
      twoHandsStable,
      openPalmStable,
      thumbsUpStable,
      pinch: anyPinch,
      swipe,
      raw: results,
    });
  }

  _gate(key, value, now, ms){
    const prop = `_${key}Since`;
    if(value){
      if(!this[prop]) this[prop] = now;
      return (now - this[prop]) >= ms;
    } else {
      this[prop] = null;
      return false;
    }
  }
}
