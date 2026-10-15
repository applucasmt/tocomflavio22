/* =============================================================
   AI — remoção de fundo + detecção facial (módulos ES)
   Carregado via <script type="module"> no index.html
   ============================================================= */

// Remoção de fundo (roda 100% no navegador)
import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.mjs';

// MediaPipe Tasks Vision (detecção facial)
import { FaceDetector, FilesetResolver }
  from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

/* ---------- Loader helpers ---------- */
function setLoader(active, text = 'Processando...', pct = null) {
  const el = document.getElementById('loader');
  const txt = document.getElementById('loaderText');
  const bar = document.getElementById('loaderBar');
  if (txt) txt.textContent = text;
  if (el) el.classList.toggle('active', active);
  if (bar) bar.style.width = (pct === null ? 0 : pct) + '%';
}

/* ---------- Estado ---------- */
let faceDetector = null;
let detectorReady = false;

/* ---------- Inicializa detector facial em background ---------- */
async function initFaceDetector() {
  if (detectorReady) return faceDetector;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5
    });
    detectorReady = true;
    return faceDetector;
  } catch (e) {
    console.warn('[AI] FaceDetector indisponível:', e);
    return null;
  }
}

/* ---------- Remoção de fundo ---------- */
async function removeBg() {
  const editor = window.Editor;
  if (!editor.hasImage()) return;

  setLoader(true, 'IA analisando a imagem...', 10);

  try {
    // Converte imagem atual para Blob
    const img = editor.image;
    const off = document.createElement('canvas');
    off.width = img.width;
    off.height = img.height;
    off.getContext('2d').drawImage(img, 0, 0);

    const inputBlob = await new Promise(res => off.toBlob(res, 'image/png'));

    setLoader(true, 'IA removendo o fundo...', 30);

    const resultBlob = await removeBackground(inputBlob, {
      output: { format: 'image/png', quality: 1 },
      progress: (key, current, total) => {
        const pct = 30 + Math.round((current / total) * 65);
        setLoader(true, `IA processando... ${Math.round((current / total) * 100)}%`, pct);
      }
    });

    const url = URL.createObjectURL(resultBlob);
    const newImg = new Image();
    newImg.onload = () => {
      URL.revokeObjectURL(url);
      editor.setImage(newImg, { resetView: false, autoRender: true });
      setLoader(false);
      window.Toast.success('✨ Fundo removido!');
    };
    newImg.onerror = () => {
      setLoader(false);
      window.Toast.error('Erro no processamento');
    };
    newImg.src = url;

  } catch (err) {
    console.error(err);
    setLoader(false);
    window.Toast.error(err.message || 'Erro ao remover fundo');
  }
}

/* ---------- Auto-enquadramento facial ---------- */
async function autoFrameFace() {
  const editor = window.Editor;
  if (!editor.hasImage()) return;

  const detector = await initFaceDetector();
  if (!detector) return;

  try {
    const img = editor.image;
    const tmp = document.createElement('canvas');
    const scale = 640 / Math.max(img.width, img.height);
    tmp.width = img.width * scale;
    tmp.height = img.height * scale;
    tmp.getContext('2d').drawImage(img, 0, 0, tmp.width, tmp.height);

    const result = detector.detect(tmp);
    if (!result.detections || result.detections.length === 0) return;

    // Pega o rosto maior (mais próximo)
    const faces = result.detections.map(d => d.boundingBox);
    faces.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const face = faces[0];

    const faceCX = (face.originX + face.width / 2) / tmp.width;
    const faceCY = (face.originY + face.height / 2) / tmp.height;

    const aspect = img.width / img.height;
    let dw, dh;
    if (aspect > 1) { dh = 1080; dw = 1080 * aspect; }
    else            { dw = 1080; dh = 1080 / aspect; }

    // Zoom automático para o rosto ocupar ~50% do quadro
    const faceSizeNorm = Math.max(face.width / tmp.width, face.height / tmp.height);
    let newZoom = editor.zoom;
    if (faceSizeNorm > 0 && faceSizeNorm < 0.5) {
      newZoom = Math.min(0.5 / faceSizeNorm, 2.5);
    }

    const fw = dw * newZoom;
    const fh = dh * newZoom;
    editor.zoom = newZoom;
    editor.panX = (0.5 - faceCX) * fw;
    editor.panY = (0.5 - faceCY) * fh;

    const zs = document.getElementById('zoomSlider');
    const zl = document.getElementById('zoomLabel');
    if (zs) zs.value = newZoom;
    if (zl) zl.textContent = Math.round(newZoom * 100) + '%';

    editor.render();
    window.Toast.success('✨ Rosto centralizado!');
  } catch (e) {
    console.warn('[AI] Auto-frame falhou:', e);
  }
}

/* ---------- Expoem para o app ---------- */
window.AI = {
  initFaceDetector,
  removeBg,
  autoFrameFace,
  async runFull() {
    await removeBg();
    await autoFrameFace();
  }
};

/* Pré-carrega o detector */
initFaceDetector();

/* Notifica o app que a IA está pronta */
window.dispatchEvent(new Event('ai-ready'));
