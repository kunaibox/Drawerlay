const video = document.getElementById('camera');
const overlayContainer = document.getElementById('overlayContainer');
const fileInput = document.getElementById('fileInput');
const opacityRange = document.getElementById('opacityRange');
const opacityVal = document.getElementById('opacityVal');
const scaleRange = document.getElementById('scaleRange');
const scaleVal = document.getElementById('scaleVal');
const startBtn = document.getElementById('startCameraBtn');
const flipBtn = document.getElementById('flipCameraBtn');

let overlay = null;
let locked = false;
let currentStream = null;
let useFrontCamera = true;

async function startCamera() {
  if(currentStream) currentStream.getTracks().forEach(track => track.stop());
  try {
    const constraints = { video: { facingMode: useFrontCamera ? 'user' : 'environment' } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;
  } catch(err) {
    alert('Camera denied or unavailable');
    console.error(err);
  }
}

startBtn.addEventListener('click', async () => {
  await startCamera();
  startBtn.style.display = 'none';
});

flipBtn.addEventListener('click', async () => {
  useFrontCamera = !useFrontCamera;
  await startCamera();
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if(overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.className = 'overlay-item';
    overlay.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(1)';
    overlay.setAttribute('data-x', 0);
    overlay.setAttribute('data-y', 0);
    const img = document.createElement('img');
    img.src = ev.target.result;
    overlay.appendChild(img);
    overlayContainer.appendChild(overlay);
    setupInteract(overlay);
  };
  reader.readAsDataURL(file);
  e.target.value='';
});

opacityRange.addEventListener('input', () => {
  if(!overlay) return;
  const value = opacityRange.value;
  overlay.querySelector('img').style.opacity = value/100;
  opacityVal.textContent = `${value}%`;
});

scaleRange.addEventListener('input', () => {
  if(!overlay) return;
  const s = scaleRange.value / 100;
  const x = parseFloat(overlay.getAttribute('data-x')) || 0;
  const y = parseFloat(overlay.getAttribute('data-y')) || 0;
  overlay.style.transform = `translate(${x}px, ${y}px) rotate(${overlay.angle||0}deg) scale(${s})`;
  overlay.scale = s;
  scaleVal.textContent = `${scaleRange.value}%`;
});

function setupInteract(el) {
  el.angle = 0;
  el.scale = 1;
  let lastTap = 0;
  el.addEventListener('pointerdown', e => {
    if(!e.isPrimary) return;
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if(tapLength < 300 && tapLength > 0){
      locked = !locked;
      el.style.border = locked?'2px solid red':'none';
    }
    lastTap = currentTime;
  });

  interact(el)
    .draggable({
      listeners:{
        move(event){
          if(locked) return;
          const x = (parseFloat(el.getAttribute('data-x'))||0) + event.dx;
          const y = (parseFloat(el.getAttribute('data-y'))||0) + event.dy;
          el.style.transform = `translate(${x}px, ${y}px) rotate(${el.angle}deg) scale(${el.scale})`;
          el.setAttribute('data-x', x);
          el.setAttribute('data-y', y);
        }
      }
    })
    .gesturable({
      listeners:{
        move(event){
          if(locked) return;
          el.angle += event.da;
          el.scale *= (1 + event.ds);
          const x = parseFloat(el.getAttribute('data-x'))||0;
          const y = parseFloat(el.getAttribute('data-y'))||0;
          el.style.transform = `translate(${x}px, ${y}px) rotate(${el.angle}deg) scale(${el.scale})`;
        }
      }
    });
}
