// All sounds are synthesized in-browser with the Web Audio API so the
// booth needs zero external audio assets and still feels analog & tactile.

class BoothAudio{
  constructor(){
    this.ctx = null;
    this.enabled = true;
    this.ambientNodes = null;
  }

  ensureCtx(){
    if(!this.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if(this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(v){ this.enabled = v; if(!v) this.stopAmbience(); }

  _noiseBuffer(duration=0.4){
    const ctx = this.ensureCtx();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
    return buffer;
  }

  _env(gainNode, t0, attack, hold, release, peak=1){
    gainNode.gain.cancelScheduledValues(t0);
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.exponentialRampToValueAtTime(peak, t0+attack);
    gainNode.gain.setValueAtTime(peak, t0+attack+hold);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0+attack+hold+release);
  }

  shutter(){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;

    // mechanical click (high-passed noise burst, two quick clacks)
    [0, 0.075].forEach((offset, i)=>{
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer(0.06);
      const hp = ctx.createBiquadFilter();
      hp.type='highpass'; hp.frequency.value = i===0 ? 1800 : 2600;
      const g = ctx.createGain();
      this._env(g, t0+offset, 0.001, 0.01, i===0?0.05:0.09, i===0?0.5:0.35);
      src.connect(hp).connect(g).connect(ctx.destination);
      src.start(t0+offset);
      src.stop(t0+offset+0.12);
    });

    // low thunk body
    const osc = ctx.createOscillator();
    osc.type='sine'; osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0+0.08);
    const og = ctx.createGain();
    this._env(og, t0, 0.001, 0.01, 0.09, 0.25);
    osc.connect(og).connect(ctx.destination);
    osc.start(t0); osc.stop(t0+0.15);
  }

  focusClick(){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type='square'; osc.frequency.value = 1500;
    const g = ctx.createGain();
    this._env(g, t0, 0.001, 0.004, 0.03, 0.06);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0+0.05);
  }

  beep(freq=880){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type='sine'; osc.frequency.value = freq;
    const g = ctx.createGain();
    this._env(g, t0, 0.005, 0.06, 0.12, 0.18);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0+0.2);
  }

  filmRoll(duration=0.9){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(duration);
    const bp = ctx.createBiquadFilter();
    bp.type='bandpass'; bp.frequency.value = 900; bp.Q.value = .7;
    const g = ctx.createGain();
    this._env(g, t0, 0.05, duration*0.6, duration*0.3, 0.12);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t0); src.stop(t0+duration+0.1);
  }

  printerHum(duration=1.6){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type='sawtooth'; osc.frequency.value = 70;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 8;
    lfo.connect(lfoGain).connect(osc.frequency);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 400;
    const g = ctx.createGain();
    this._env(g, t0, 0.1, duration*0.7, duration*0.2, 0.1);
    osc.connect(lp).connect(g).connect(ctx.destination);
    osc.start(t0); lfo.start(t0);
    osc.stop(t0+duration); lfo.stop(t0+duration);
  }

  polaroidEject(){
    if(!this.enabled) return;
    const ctx = this.ensureCtx();
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.5);
    const bp = ctx.createBiquadFilter();
    bp.type='bandpass'; bp.Q.value=1;
    bp.frequency.setValueAtTime(400, t0);
    bp.frequency.exponentialRampToValueAtTime(2200, t0+0.45);
    const g = ctx.createGain();
    this._env(g, t0, 0.02, 0.2, 0.3, 0.15);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t0); src.stop(t0+0.55);
  }

  startAmbience(){
    if(!this.enabled || this.ambientNodes) return;
    const ctx = this.ensureCtx();
    const osc1 = ctx.createOscillator(); osc1.type='sine'; osc1.frequency.value = 110;
    const osc2 = ctx.createOscillator(); osc2.type='sine'; osc2.frequency.value = 164.8;
    const g = ctx.createGain(); g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.02, ctx.currentTime+2);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 500;
    osc1.connect(lp); osc2.connect(lp); lp.connect(g).connect(ctx.destination);
    osc1.start(); osc2.start();
    this.ambientNodes = {osc1, osc2, g};
  }

  stopAmbience(){
    if(!this.ambientNodes) return;
    const ctx = this.ensureCtx();
    const {osc1, osc2, g} = this.ambientNodes;
    g.gain.linearRampToValueAtTime(0, ctx.currentTime+.8);
    setTimeout(()=>{ try{osc1.stop(); osc2.stop();}catch(e){} }, 900);
    this.ambientNodes = null;
  }
}

export const audio = new BoothAudio();
