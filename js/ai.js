/* =============================================================
   AI — remoção de fundo (MediaPipe) + detecção facial
   Carregado como <script type="module">
   ============================================================= */

import {
  ImageSegmenter,
  FaceDetector,
  FilesetResolver
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

/* ---------- Loader ---------- */
function setLoader(active, text, pct) {
  const el = document.getElementById('loader');
  const txt = document.getElementById('loaderText');
  const bar = document.getElementById('loaderBar');
  if (txt && text) txt.textContent = text;
  if (el) el.classList.toggle('active', active);
  if (bar) bar.style.width = (pct === null || pct === undefined ? 0 : pct) + '%';
}

/* ---------- Estado ---------- */
let segmenter = null;
let faceDetector = null;
let segmenterReady = false;
let detectorReady = false;

/* ---------- Init Segmenter ---------- */
async function initSegmenter() {
  if (segmenterReady) return segmenter;
  try {
    setLoader(true, 'Carregando modelo de recorte...', 5);

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      outputCategoryMask: false,
      outputConfidenceMasks: true
    });

    segmenterReady = true;
    setLoader(false);
    return segmenter;
  } catch (e) {
    console.error('[AI] Segmenter falhou:', e);
    setLoader(false);
    return null;
  }
}

/* ---------- Init FaceDetector ---------- */
async function initFaceDetector() {
  if (detectorReady) return faceDetector;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU'
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

  setLoader(true, 'Preparando recorte...', 15);

  try {
    const seg = await initSegmenter();
    if (!seg) {
      if (window.Toast) Toast.error('Modelo de recorte não disponível');
      return;
    }

    const img = editor.image;
    const MAX = 1024;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, w, h);

    setLoader(true, 'IA analisando pessoa...', 40);

    const result = await new Promise(function(resolve) {
      seg.segment(off, function(res) { resolve(res); });
    });

    setLoader(true, 'Aplicando máscara...', 70);

    const masks = result.confidenceMasks;
    if (!masks || masks.length === 0) throw new Error('Sem máscara');

    const mask = masks[0];
    const maskData = mask.getAsFloat32Array();

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const octx2 = out.getContext('2d');
    octx2.drawImage(off, 0, 0);
    const imageData = octx2.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < maskData.length; i++) {
      const alpha = Math.max(0, Math.min(1, maskData[i]));
      data[i * 4 + 3] = Math.round(data[i * 4 + 3] * alpha);
    }
    octx2.putImageData(imageData, 0, 0);

    setLoader(true, 'Finalizando...', 90);

    const newImg = new Image();
    newImg.onload = function() {
      editor.setImage(newImg, { resetView: false, autoRender: true });
      setLoader(false);
      if (window.Toast) Toast.success('✨ Fundo removido!');
    };
    newImg.onerror = function() {
      setLoader(false);
      if (window.Toast) Toast.error('Erro ao aplicar recorte');
    };
    newImg.src = out.toDataURL('image/png');

  } catch (err) {
    console.error(err);
    setLoader(false);
    if (window.Toast) Toast.error('Erro ao remover fundo: ' + err.message);
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

    const faces = result.detections.map(function(d) { return d.boundingBox; });
    faces.sort(function(a, b) { return (b.width * b.height) - (a.width * a.height); });
    const face = faces[0];

    const faceCX = (face.originX + face.width / 2) / tmp.width;
    const faceCY = (face.originY + face.height / 2) / tmp.height;

    const aspect = img.width / img.height;
    let dw, dh;
    if (aspect > 1) { dh = 1080; dw = 1080 * aspect; }
    else { dw = 1080; dh = 1080 / aspect; }

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
    if (window.Toast) Toast.success('✨ Rosto centralizado!');
  } catch (e) {
    console.warn('[AI] Auto-frame falhou:', e);
  }
}

/* ---------- API pública ---------- */
window.AI = {
  initFaceDetector: initFaceDetector,
  initSegmenter: initSegmenter,
  removeBg: removeBg,
  autoFrameFace: autoFrameFace,
  runFull: async function() {
    await removeBg();
    await autoFrameFace();
  }
};

/* Pré-carrega detector facial em background */
setTimeout(function() {
  initFaceDetector().catch(function() {});
}, 1500);

window.dispatchEvent(new Event('ai-ready'));
