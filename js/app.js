/**
 * OUIDAH CONNECT - Script Frontend (Version avec choix de paiement)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ OUIDAH CONNECT Frontend initialisé avec succès');

    // ==========================================
    // 1. GESTION DU MENU MOBILE
    // ==========================================
    const btnMenuMobile = document.getElementById('navToggle');
    const navMain = document.getElementById('navMenu');

    if (btnMenuMobile && navMain) {
        btnMenuMobile.addEventListener('click', () => {
            navMain.classList.toggle('active');
            btnMenuMobile.textContent = navMain.classList.contains('active') ? '✕' : '☰';
        });
        
        const navLinks = navMain.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMain.classList.remove('active');
                if (btnMenuMobile) btnMenuMobile.textContent = '☰';
            });
        });
    }

    // ==========================================
    // 2. CALCULATEUR DE PRIX
    // ==========================================
    const formBillet = document.getElementById('formBillet');
    const typeBillet = document.getElementById('typeBillet');
    const nombreBillets = document.getElementById('nombreBillets');
    const guideOption = document.getElementById('guideOption');
    
    const sousTotalEl = document.getElementById('sousTotal');
    const fraisServiceEl = document.getElementById('fraisService');
    const prixTotalEl = document.getElementById('prixTotal');

    const tarifs = {
        'adulte_etranger': 5000,
        'adulte_national': 2000,
        'enfant': 1000,
        'etudiant': 1500,
        'groupe': 1500,
        'vip': 15000
    };
    const FRAIS_SERVICE = 200;

    function calculerPrix() {
        if (!typeBillet || !typeBillet.value || !nombreBillets || !nombreBillets.value) {
            if(sousTotalEl) sousTotalEl.textContent = '0 FCFA';
            if(fraisServiceEl) fraisServiceEl.textContent = '0 FCFA';
            if(prixTotalEl) prixTotalEl.textContent = '0 FCFA';
            return;
        }

        const prixUnitaire = tarifs[typeBillet.value] || 0;
        const nb = parseInt(nombreBillets.value) || 1;
        const prixGuide = (guideOption && guideOption.value === 'oui') ? 5000 : 0;

        const sousTotal = (prixUnitaire * nb) + prixGuide;
        const frais = FRAIS_SERVICE * nb;
        const total = sousTotal + frais;

        if(sousTotalEl) sousTotalEl.textContent = sousTotal.toLocaleString('fr-FR') + ' FCFA';
        if(fraisServiceEl) fraisServiceEl.textContent = frais.toLocaleString('fr-FR') + ' FCFA';
        if(prixTotalEl) prixTotalEl.textContent = total.toLocaleString('fr-FR') + ' FCFA';
    }

    if (typeBillet) typeBillet.addEventListener('change', calculerPrix);
    if (nombreBillets) nombreBillets.addEventListener('input', calculerPrix);
    if (guideOption) guideOption.addEventListener('change', calculerPrix);

    // ==========================================
    // 3. ENVOI DU FORMULAIRE (AVEC CHOIX PAIEMENT)
    // ==========================================
    if (formBillet) {
        formBillet.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btnSubmit = formBillet.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = '🔄 Préparation...';
            btnSubmit.disabled = true;

            const siteSelect = document.getElementById('siteChoisi');
            const nomSite = siteSelect ? siteSelect.options[siteSelect.selectedIndex].text : 'Site non spécifié';
            
            const nomVisiteur = document.getElementById('nomVisiteur')?.value || 'Visiteur';
            const emailVisiteur = document.getElementById('emailVisiteur')?.value || '';
            const telVisiteur = document.getElementById('telVisiteur')?.value || '';
            const typeVal = typeBillet ? typeBillet.value : 'Inconnu';
            const dateVisite = document.getElementById('dateVisite')?.value || '';
            const heure = document.getElementById('creneau')?.value || '';
            const nomGuide = document.getElementById('nomGuide')?.value || 'Non assigné';
            
            let prixTotal = '0';
            if (prixTotalEl) {
                prixTotal = prixTotalEl.textContent.replace(' FCFA', '').replace(/\s/g, '').replace(/\./g, '');
            }

            const numBillet = 'OUD-' + Date.now().toString().slice(-6);

            const data = {
                nomVisiteur: nomVisiteur,
                email: emailVisiteur,
                telephone: telVisiteur,
                nomSite: nomSite,
                numBillet: numBillet,
                typeBillet: typeVal,
                dateVisite: dateVisite,
                heure: heure,
                prix: prixTotal,
                nomGuide: nomGuide
            };

            // Afficher l'écran de choix de paiement
            afficherChoixPaiement(data);
            
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        });
    }

    // ==========================================
    // 4. ÉCRAN DE CHOIX DE PAIEMENT
    // ==========================================
    function afficherChoixPaiement(data) {
        const modal = document.createElement('div');
        modal.id = 'modalPaiement';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center;
            align-items: center; z-index: 9999; padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: 'Montserrat', sans-serif;">
                <h2 style="color: #A0522D; margin-bottom: 10px; text-align: center;">💳 Choisissez votre mode de paiement</h2>
                <p style="text-align: center; color: #666; margin-bottom: 20px;">
                    Montant à payer : <strong style="color: #2E7D32; font-size: 1.3rem;">${parseInt(data.prix).toLocaleString('fr-FR')} FCFA</strong>
                </p>
                
                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                    <button onclick="choisirPaiement('MTN_MOMO', this)" class="btn-paiement" data-mode="MTN_MOMO">
                        📱 <strong>MTN Mobile Money</strong>
                        <small>Paiement instantané</small>
                    </button>
                    <button onclick="choisirPaiement('MOOV_MONEY', this)" class="btn-paiement" data-mode="MOOV_MONEY">
                        📱 <strong>Moov Money</strong>
                        <small>Paiement instantané</small>
                    </button>
                    <button onclick="choisirPaiement('CARTE Bancaire', this)" class="btn-paiement" data-mode="CARTE">
                        💳 <strong>Carte Bancaire</strong>
                        <small>Visa, Mastercard</small>
                    </button>
                    <button onclick="choisirPaiement('ESPECES_SUR_PLACE', this)" class="btn-paiement" data-mode="ESPECES">
                        💵 <strong>Espèces sur place</strong>
                        <small>Paiement à l'entrée du site</small>
                    </button>
                </div>
                
                <button onclick="document.getElementById('modalPaiement').remove()" style="width: 100%; padding: 10px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; color: #666;">
                    Annuler
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Stocker les données globalement pour les utiliser après choix
        window._dataBillet = data;
    }

    // Fonction globale appelée par les boutons
    window.choisirPaiement = function(mode, btnElement) {
        const data = window._dataBillet;
        data.modePaiement = mode;
        
        // Désactiver tous les boutons
        document.querySelectorAll('.btn-paiement').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });
        btnElement.style.opacity = '1';
        btnElement.innerHTML = '✅ Traitement en cours...';
        
        // Envoyer au backend
        envoyerAuBackend(data);
    };

    // ==========================================
    // 5. ENVOI AU BACKEND GOOGLE
    // ==========================================
    function envoyerAuBackend(data) {
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxi5Y2_6g-8R6nKp3WzwWkxZyatiT0_A8gC1P3593jFZfgWjJI3evTSGCqfHNX9loZ7/exec';

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            document.getElementById('modalPaiement').remove();
            
            if (result.status === 'success') {
                afficherConfirmation(data, result);
            } else {
                alert('❌ Erreur : ' + result.message);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('❌ Erreur de connexion. Vérifiez votre internet.');
        });
    }

    // ==========================================
    // 6. CONFIRMATION SELON LE MODE DE PAIEMENT
    // ==========================================
    function afficherConfirmation(data, result) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); display: flex; justify-content: center;
            align-items: center; z-index: 9999; padding: 20px;
        `;
        
        let instructionsPaiement = '';
        
        if (data.modePaiement === 'MTN_MOMO') {
            instructionsPaiement = `
                <div style="background: #FFCC00; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px; color: #000;">📱 Instructions MTN MoMo</h4>
                    <ol style="text-align: left; margin: 0; padding-left: 20px; color: #000;">
                        <li>Composez <strong>*133#</strong></li>
                        <li>Choisissez "Transfert d'argent"</li>
                        <li>Envoyez <strong>${parseInt(data.prix).toLocaleString('fr-FR')} FCFA</strong> au numéro :</li>
                        <li style="font-size: 1.2rem; font-weight: bold;">+229 XX XX XX XX</li>
                        <li>Référence : <strong>${data.numBillet}</strong></li>
                    </ol>
                </div>
                <p style="color: #A0522D; font-weight: 600;">⏳ Votre billet sera activé après confirmation du paiement (sous 5 min).</p>
            `;
        } else if (data.modePaiement === 'MOOV_MONEY') {
            instructionsPaiement = `
                <div style="background: #0066CC; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px;">📱 Instructions Moov Money</h4>
                    <ol style="text-align: left; margin: 0; padding-left: 20px;">
                        <li>Composez <strong>*155#</strong></li>
                        <li>Choisissez "Transfert"</li>
                        <li>Envoyez <strong>${parseInt(data.prix).toLocaleString('fr-FR')} FCFA</strong> au numéro :</li>
                        <li style="font-size: 1.2rem; font-weight: bold;">+229 XX XX XX XX</li>
                        <li>Référence : <strong>${data.numBillet}</strong></li>
                    </ol>
                </div>
                <p style="color: #A0522D; font-weight: 600;">⏳ Votre billet sera activé après confirmation du paiement.</p>
            `;
        } else if (data.modePaiement === 'CARTE') {
            instructionsPaiement = `
                <div style="background: #2E7D32; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px;">💳 Paiement par Carte</h4>
                    <p>Le paiement sécurisé par carte sera disponible prochainement via notre partenaire FedaPay.</p>
                    <p><strong>Merci de contacter le +229 XX XX XX XX</strong> pour finaliser votre réservation.</p>
                </div>
            `;
        } else if (data.modePaiement === 'ESPECES_SUR_PLACE') {
            instructionsPaiement = `
                <div style="background: #A0522D; color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px;">💵 Paiement sur place</h4>
                    <p>Présentez ce billet à l'entrée du site et payez <strong>${parseInt(data.prix).toLocaleString('fr-FR')} FCFA</strong> en espèces.</p>
                    <p style="margin-top: 10px;"><strong>⚠️ Important :</strong> Ce billet est valable 24h. Passé ce délai, il sera annulé automatiquement.</p>
                </div>
            `;
        }
        
        let whatsappButtons = '';
        if (result.whatsappLink) {
            whatsappButtons = `
                <p style="margin: 15px 0;">📱 <strong>Envoyez votre billet par WhatsApp :</strong></p>
                <a href="${result.whatsappLink}" target="_blank" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px;">
                    Ouvrir WhatsApp
                </a>
            `;
        }

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; font-family: 'Montserrat', sans-serif; text-align: center;">
                <h2 style="color: #2E7D32; margin-bottom: 15px;">✅ Réservation enregistrée !</h2>
                <p style="margin-bottom: 15px;">Votre numéro de billet : <strong style="color: #A0522D; font-size: 1.2rem;">${data.numBillet}</strong></p>
                
                ${instructionsPaiement}
                
                ${whatsappButtons}
                
                <button onclick="this.closest('div[style]').remove(); location.reload();" style="background: #A0522D; color: white; padding: 12px 30px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 15px; width: 100%;">
                    Fermer
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        formBillet.reset();
        if(sousTotalEl) sousTotalEl.textContent = '0 FCFA';
        if(fraisServiceEl) fraisServiceEl.textContent = '0 FCFA';
        if(prixTotalEl) prixTotalEl.textContent = '0 FCFA';
    }
});