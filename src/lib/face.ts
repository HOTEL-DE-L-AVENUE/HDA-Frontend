// Reconnaissance faciale dans le navigateur (@vladmandic/face-api).
// Le navigateur ne fait que calculer la signature du visage (128 nombres) ; la
// comparaison avec les employés enregistrés se fait sur le serveur.
// La bibliothèque (~1,3 Mo, TensorFlow.js inclus) n'est chargée qu'à l'ouverture de la
// caméra, pas au chargement de l'application.
type FaceApi = typeof import('@vladmandic/face-api');
let faceapi: FaceApi;

// Modèles copiés dans public/models/face (servis par l'application, pas de CDN).
const MODELS_URL = `${import.meta.env.BASE_URL}models/face`;
let modelsLoading: Promise<void> | null = null;

export const loadFaceModels = () => {
  if (!modelsLoading) {
    modelsLoading = (async () => {
      faceapi = await import('@vladmandic/face-api');
      // Moteur de calcul : carte graphique (webgl) si possible, sinon processeur.
      const tf = faceapi.tf as any;
      try { await tf.setBackend('webgl'); } catch { await tf.setBackend('cpu'); }
      await tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
      ]);
    })().catch((err) => { modelsLoading = null; throw err; });
  }
  return modelsLoading;
};

export interface DetectedFace { descriptor: number[]; eyeRatio: number; width: number; score: number; }

type Point = { x: number; y: number };
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
// Ouverture de l'œil (Eye Aspect Ratio) : chute nettement quand l'œil se ferme.
const eyeAspectRatio = (eye: Point[]) => (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));

export interface TrackedFace { eyeRatio: number; yaw: number; width: number; cx: number; cy: number; score: number; }
const center = (points: Point[]) => ({ x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length });

// Détection rapide sans signature (3 à 4 fois plus rapide) : sert à suivre le geste
// de vérification. yaw = décalage du bout du nez par rapport au milieu des yeux,
// rapporté à l'écart entre les yeux : ~0 de face, nettement ± quand la tête tourne.
// Sur une photo qu'on incline, tout se comprime ensemble et yaw reste proche de 0.
export const trackFaces = async (video: HTMLVideoElement): Promise<TrackedFace[]> => {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const results = await faceapi.detectAllFaces(video, options).withFaceLandmarks();
  return results.map((r) => {
    const leftEye = r.landmarks.getLeftEye(); const rightEye = r.landmarks.getRightEye();
    const l = center(leftEye); const rc = center(rightEye);
    const noseTip = r.landmarks.getNose()[3]; // point 30 du modèle 68 points
    const box = r.detection.box;
    return {
      eyeRatio: (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2,
      yaw: (noseTip.x - (l.x + rc.x) / 2) / (dist(l, rc) || 1),
      width: box.width, cx: box.x + box.width / 2, cy: box.y + box.height / 2, score: r.detection.score,
    };
  });
};

// Tous les visages visibles sur l'image (la borne refuse s'il y en a plusieurs).
// À appeler après loadFaceModels().
export const detectFaces = async (video: HTMLVideoElement): Promise<DetectedFace[]> => {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const results = await faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors();
  return results.map((r) => ({
    descriptor: Array.from(r.descriptor),
    eyeRatio: (eyeAspectRatio(r.landmarks.getLeftEye()) + eyeAspectRatio(r.landmarks.getRightEye())) / 2,
    width: r.detection.box.width,
    score: r.detection.score,
  }));
};

export const descriptorDistance = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));

// Photo JPEG du pointage (preuve consultable par l'admin).
export const snapshot = (video: HTMLVideoElement, width = 480) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round((video.videoHeight / video.videoWidth) * width) || Math.round(width * 0.75);
  canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
};

// Caméra frontale. La caméra n'est autorisée par le navigateur qu'en HTTPS ou sur localhost.
export const startCamera = async (video: HTMLVideoElement) => {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('La caméra nécessite une connexion sécurisée (HTTPS) ou localhost.');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = stream;
    await video.play();
    return () => stream.getTracks().forEach((track) => track.stop());
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') throw new Error('Accès à la caméra refusé : autorisez la caméra pour ce site dans le navigateur.');
    if (err?.name === 'NotFoundError') throw new Error('Aucune caméra détectée sur cet appareil.');
    throw new Error('Impossible de démarrer la caméra.');
  }
};
