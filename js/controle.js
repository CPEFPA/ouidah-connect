/**
 * OUIDAH CONNECT - Module de Contrôle d'Accès
 * Scan QR Code + Validation + Mode Hors-Ligne
 */

// ⚠️ REMPLACEZ PAR VOTRE URL DE DÉPLOIEMENT
const API_URL = 'https://script.google.com/macros/s/AKfycbxi5Y2_6g-8R6nKp3WzwWkxZyatiT0_A8gC1P3593jFZfgWjJI3evTSGCqfHNX9loZ7/exec';

let html5QrCode = null;
let scanning = false;

// Statistiques du jour (stockées localement)
let stats = {
  valides: 0,
  refuses: 0,
  attente: 0
};

// Charger les stats depuis localStorage au démarrage
window.addEventListener('DOMContentLoaded', () => {
  const savedStats = localStorage.getItem('ouidah_stats_' + new Date().toDateString());
  if (savedStats) {
    stats = JSON.parse(savedStats);
    updateStatsDisplay();
  }
  
  // Vérifier la connexion
  updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  
  // Synchroniser les scans en attente si on est en ligne
  if (navigator.onLine) {
    synchroniserScansEnAttente();
  }
  
  // Boutons
  document.getElementById('btnStartScan').addEventListener('click', demarrerScanner);
  document.getElementById('btnStopScan').addEventListener('click', arreterScanner);
  document.getElementById('btnManualCheck').addEventListener('click', verifierManuel);
  document.getElementById('btnCloseResult').addEventListener('click', () => {
    document.getElementById('resultatValidation').style.display = 'none';
  });
});

// --- GESTION DE LA CONNEXION ---
function updateConnectionStatus() {
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');
  
  if (navigator.onLine) {
    statusBar.className = 'status-bar online';
    statusText.textContent = 'En ligne';
    synchroniserScansEnAttente();
  } else {
    statusBar.className = 'status-bar offline';
    statusText.textContent = 'Mode hors-ligne';
  }
}

// --- SCANNER QR CODE ---
async function demarrerScanner() {
  try {
    html5QrCode = new Html5Qrcode("reader");
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };
    
    await html5QrCode.start(
      { facingMode: "environment" }, // Caméra arrière
      config,
      onScanSuccess,
      onScanFailure
    );
    
    scanning = true;
    document.getElementById('btnStartScan').style.display = 'none';
    document.getElementById('btnStopScan').style.display = 'block';
    
  } catch (err) {
    alert('❌ Impossible d\'accéder à la caméra : ' + err);
  }
}

async function arreterScanner() {
  if (html5QrCode && scanning) {
    await html5QrCode.stop();
    scanning = false;
    document.getElementById('btnStartScan').style.display = 'block';
    document.getElementById('btnStopScan').style.display = 'none';
  }
}

// --- TRAITEMENT DU QR CODE SCANNÉ ---
async function onScanSuccess(decodedText) {
  // Éviter les scans multiples du même billet en 2 secondes
  if (window.lastScan === decodedText) return;
  window.lastScan = decodedText;
  setTimeout(() => { window.lastScan = null; }, 2000);
  
  // Vibrer pour confirmer le scan
  if (navigator.vibrate) navigator.vibrate(100);
  
  await verifierBillet(decodedText);
}

function onScanFailure(error) {
  // Ignorer les erreurs normales de scan
}

// --- VÉRIFICATION MANUELLE ---
async function verifierManuel() {
  const numero = document.getElementById('manualBillet').value.trim();
  if (!numero) {
    alert('Veuillez saisir un numéro de billet.');
    return;
  }
  await verifierBillet(numero);
  document.getElementById('manualBillet').value = '';
}

// --- LOGIQUE DE VÉRIFICATION ---
async function verifierBillet(numBillet) {
  const agent = document.getElementById('agentNom').value || 'Agent';
  const site = document.getElementById('siteChoisi').value;
  
  const data = {
    action: 'verifier_billet',
    numBillet: numBillet,
    agent: agent,
    site: site,
    timestamp: new Date().toISOString()
  };
  
  // Si on est hors-ligne, stocker en local
  if (!navigator.onLine) {
    stockerScanLocal(data);
    afficherResultat('attente', {
      numBillet: numBillet,
      message: 'Billet stocké. Sera vérifié quand la connexion reviendra.'
    });
    return;
  }
  
  // Sinon, envoyer au serveur
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      if (result.valide) {
        stats.valides++;
        afficherResultat('valide', result);
      } else {
        stats.refuses++;
        afficherResultat('invalide', result);
      }
      sauvegarderStats();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
    // En cas d'erreur réseau, stocker en local
    stockerScanLocal(data);
    afficherResultat('attente', {
      numBillet: numBillet,
      message: 'Erreur de connexion. Billet stocké localement.'
    });
  }
}

// --- AFFICHAGE DU RÉSULTAT ---
function afficherResultat(type, data) {
  const resultat = document.getElementById('resultatValidation');
  const icon = document.getElementById('resultatIcon');
  const titre = document.getElementById('resultatTitre');
  const details = document.getElementById('resultatDetails');
  
  resultat.className = 'resultat ' + type;
  
  if (type === 'valide') {
    icon.textContent = '✅';
    titre.textContent = 'ACCÈS AUTORISÉ';
    details.innerHTML = `
      <p><strong>Billet :</strong> ${data.numBillet}</p>
      <p><strong>Visiteur :</strong> ${data.nomVisiteur || 'N/A'}</p>
      <p><strong>Site :</strong> ${data.nomSite || 'N/A'}</p>
      <p><strong>Type :</strong> ${data.typeBillet || 'N/A'}</p>
      <p style="color: #2E7D32; font-weight: bold; margin-top: 10px;">✓ Bienvenue à Ouidah !</p>
    `;
    // Son de validation (bip)
    jouerSon('valide');
  } else if (type === 'invalide') {
    icon.textContent = '❌';
    titre.textContent = 'ACCÈS REFUSÉ';
    details.innerHTML = `
      <p><strong>Billet :</strong> ${data.numBillet}</p>
      <p style="color: #C62828; font-weight: bold;">${data.message || 'Billet invalide ou déjà utilisé.'}</p>
    `;
    jouerSon('invalide');
  } else {
    icon.textContent = '⏳';
    titre.textContent = 'EN ATTENTE';
    details.innerHTML = `
      <p><strong>Billet :</strong> ${data.numBillet}</p>
      <p>${data.message}</p>
    `;
  }
  
  resultat.style.display = 'flex';
  updateStatsDisplay();
  
  // Fermeture automatique après 5 secondes pour les validations valides
  if (type === 'valide') {
    setTimeout(() => {
      resultat.style.display = 'none';
    }, 5000);
  }
}

// --- SON DE FEEDBACK ---
function jouerSon(type) {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    if (type === 'valide') {
      oscillator.frequency.value = 800;
    } else {
      oscillator.frequency.value = 200;
    }
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  } catch (e) {
    // Silencieux si audio indisponible
  }
}

// --- STOCKAGE HORS-LIGNE ---
function stockerScanLocal(data) {
  const scans = JSON.parse(localStorage.getItem('ouidah_scans_attente') || '[]');
  scans.push(data);
  localStorage.setItem('ouidah_scans_attente', JSON.stringify(scans));
  stats.attente = scans.length;
  sauvegarderStats();
}

async function synchroniserScansEnAttente() {
  const scans = JSON.parse(localStorage.getItem('ouidah_scans_attente') || '[]');
  if (scans.length === 0) return;
  
  console.log(`🔄 Synchronisation de ${scans.length} scan(s) en attente...`);
  
  for (const scan of scans) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(scan)
      });
    } catch (e) {
      console.error('Erreur de sync pour:', scan.numBillet);
      return; // On arrête si la connexion est instable
    }
  }
  
  // Tout a été synchronisé, on vide la liste
  localStorage.setItem('ouidah_scans_attente', '[]');
  stats.attente = 0;
  sauvegarderStats();
  document.getElementById('dernierSync').textContent = new Date().toLocaleTimeString('fr-FR');
}

// --- STATISTIQUES ---
function sauvegarderStats() {
  localStorage.setItem('ouidah_stats_' + new Date().toDateString(), JSON.stringify(stats));
}

function updateStatsDisplay() {
  document.getElementById('statValides').textContent = stats.valides;
  document.getElementById('statRefuses').textContent = stats.refuses;
  document.getElementById('statAttente').textContent = stats.attente;
}