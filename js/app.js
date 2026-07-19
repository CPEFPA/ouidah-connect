/**
 * OUIDAH CONNECT - Script principal Frontend (Version Finale et Propre)
 * Gestion de l'interface utilisateur, calculs et interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    
    console.log('✅ OUIDAH CONNECT Frontend initialisé avec succès');

        // ==========================================
    // 1. GESTION DU MENU MOBILE (Version corrigée)
    // ==========================================
    const btnMenuMobile = document.getElementById('navToggle');
    const navMain = document.getElementById('navMenu');

    if (btnMenuMobile && navMain) {
        btnMenuMobile.addEventListener('click', () => {
            navMain.classList.toggle('active');
            // Change l'icône hamburger en croix
            btnMenuMobile.textContent = navMain.classList.contains('active') ? '✕' : '☰';
        });
        
        // Fermer le menu quand on clique sur un lien (sur mobile)
        const navLinks = navMain.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMain.classList.remove('active');
                btnMenuMobile.textContent = '☰';
            });
        });
    }

    // ==========================================
    // 2. GESTION DU MODAL DE CONNEXION
    // ==========================================
    const btnConnexion = document.getElementById('btnConnexion');
    const modalConnexion = document.getElementById('modalConnexion');
    const modalClose = document.getElementById('modalClose');

    if (btnConnexion && modalConnexion) {
        btnConnexion.addEventListener('click', () => {
            modalConnexion.classList.add('active');
        });
    }

    if (modalClose && modalConnexion) {
        modalClose.addEventListener('click', () => {
            modalConnexion.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalConnexion) {
            modalConnexion.classList.remove('active');
        }
    });

    // ==========================================
    // 3. CALCULATEUR DE PRIX (BILLETTERIE)
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
        'scolaire': 500,
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
    // 4. DÉFILEMENT FLUIDE (SMOOTH SCROLL)
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (navMain && navMain.classList.contains('active')) {
                    navMain.classList.remove('active');
                    if(btnMenuMobile) btnMenuMobile.textContent = '☰';
                }
            }
        });
    });

    // ==========================================
    // 5. ENVOI DU FORMULAIRE VERS GOOGLE APPS SCRIPT
    // ==========================================
    if (formBillet) {
        formBillet.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btnSubmit = formBillet.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = '🔄 Génération en cours...';
            btnSubmit.disabled = true;

            const siteSelect = document.getElementById('siteChoisi');
            const nomSite = siteSelect ? siteSelect.options[siteSelect.selectedIndex].text : 'Site non spécifié';
            
            const nomVisiteur = document.getElementById('nomVisiteur')?.value || 'Visiteur';
            const emailVisiteur = document.getElementById('emailVisiteur')?.value || '';
            const telVisiteur = document.getElementById('telVisiteur')?.value || '';
            const typeVal = typeBillet ? typeBillet.value : 'Inconnu';
            const dateVisite = document.getElementById('dateVisite')?.value || '';
            const heure = document.getElementById('creneau')?.value || '';
            
            // Nettoyer le prix pour n'avoir que des chiffres
            let prixTotal = '0';
            if (prixTotalEl) {
                prixTotal = prixTotalEl.textContent.replace(' FCFA', '').replace(/\s/g, '').replace('.', '');
            }

            const data = {
                nomVisiteur: nomVisiteur,
                email: emailVisiteur,
                telephone: telVisiteur,
                nomSite: nomSite,
                numBillet: 'OUD-' + Date.now().toString().slice(-6),
                typeBillet: typeVal,
                dateVisite: dateVisite,
                heure: heure,
                prix: prixTotal
            };

            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxi5Y2_6g-8R6nKp3WzwWkxZyatiT0_A8gC1P3593jFZfgWjJI3evTSGCqfHNX9loZ7/exec';

            fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    // Création de la fenêtre modale élégante
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
                        align-items: center; z-index: 9999;
                    `;
                    
                    const contenu = document.createElement('div');
                    contenu.style.cssText = `
                        background: white; padding: 30px; border-radius: 12px;
                        max-width: 450px; text-align: center; font-family: 'Montserrat', sans-serif;
                    `;
                    
                    let whatsappButtons = '';
                    if (result.whatsappLink) {
                        whatsappButtons = `
                            <p style="margin: 15px 0; color: #333;">📱 <strong>Envoyer le billet par WhatsApp :</strong></p>
                            <a href="${result.whatsappLink}" target="_blank" 
                               style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; 
                               border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 10px;">
                               Ouvrir WhatsApp
                            </a>
                            <br>
                            <button onclick="navigator.clipboard.writeText('${result.whatsappLink}'); alert('✅ Lien copié !');"
                                    style="background: #f0f0f0; color: #333; padding: 10px 20px; border: 1px solid #ccc; 
                                    border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-top: 5px;">
                                📋 Copier le lien
                            </button>
                        `;
                    }

                    const emailMsg = result.emailEnvoye ? 'Un email vous a été envoyé.' : 'Quota email atteint, utilisez WhatsApp.';

                    contenu.innerHTML = `
                        <h2 style="color: #2E7D32; margin-bottom: 15px;">✅ Réservation Réussie !</h2>
                        <p style="margin-bottom: 20px; color: #555;">Votre billet a été généré.<br>${emailMsg}</p>
                        ${whatsappButtons}
                        <br><br>
                        <button onclick="this.closest('div[style]').remove(); location.reload();" 
                                style="background: #A0522D; color: white; padding: 10px 30px; border: none; 
                                border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                            Fermer
                        </button>
                    `;
                    
                    modal.appendChild(contenu);
                    document.body.appendChild(modal);
                    
                    // Réinitialiser le formulaire
                    formBillet.reset();
                    if(sousTotalEl) sousTotalEl.textContent = '0 FCFA';
                    if(fraisServiceEl) fraisServiceEl.textContent = '0 FCFA';
                    if(prixTotalEl) prixTotalEl.textContent = '0 FCFA';
                } else {
                    alert('❌ Erreur : ' + result.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('❌ Une erreur de connexion est survenue. Vérifiez votre connexion internet.');
            })
            .finally(() => {
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            });
        });
    }
});