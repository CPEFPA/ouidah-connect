/**
 * OUIDAH CONNECT - Script principal Frontend
 * Gestion de l'interface utilisateur, calculs et interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. GESTION DU MENU MOBILE
    // ==========================================
    const btnMenuMobile = document.getElementById('btnMenuMobile');
    const navMain = document.getElementById('navMain');

    if (btnMenuMobile && navMain) {
        btnMenuMobile.addEventListener('click', () => {
            navMain.classList.toggle('active');
            // Change l'icône hamburger en croix
            btnMenuMobile.textContent = navMain.classList.contains('active') ? '✕' : '☰';
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

    // Fermer le modal en cliquant en dehors du contenu
    window.addEventListener('click', (e) => {
        if (e.target === modalConnexion) {
            modalConnexion.classList.remove('active');
        }
    });

    // ==========================================
    // 3. CALCULATEUR DE PRIX (BILLETTERIE)
    // ==========================================
    const formBillet = document.getElementById('formBillet');
    const siteChoisi = document.getElementById('siteChoisi');
    const typeBillet = document.getElementById('typeBillet');
    const nombreBillets = document.getElementById('nombreBillets');
    const guideOption = document.getElementById('guideOption');
    
    const sousTotalEl = document.getElementById('sousTotal');
    const fraisServiceEl = document.getElementById('fraisService');
    const prixTotalEl = document.getElementById('prixTotal');

    // Tarifs de base (en FCFA) - À synchroniser avec la BDD plus tard
    const tarifs = {
        'adulte_etranger': 5000,
        'adulte_national': 2000,
        'enfant': 1000,
        'etudiant': 1500,
        'groupe': 1500, // par personne
        'scolaire': 500,
        'vip': 15000
    };

    const FRAIS_SERVICE = 200; // Frais fixes par billet

    function calculerPrix() {
        if (!typeBillet.value || !nombreBillets.value) {
            sousTotalEl.textContent = '0 FCFA';
            fraisServiceEl.textContent = '0 FCFA';
            prixTotalEl.textContent = '0 FCFA';
            return;
        }

        const prixUnitaire = tarifs[typeBillet.value] || 0;
        const nb = parseInt(nombreBillets.value) || 1;
        const prixGuide = guideOption.value === 'oui' ? 5000 : 0; // 5000 FCFA pour un guide

        const sousTotal = (prixUnitaire * nb) + prixGuide;
        const frais = FRAIS_SERVICE * nb;
        const total = sousTotal + frais;

        sousTotalEl.textContent = sousTotal.toLocaleString('fr-FR') + ' FCFA';
        fraisServiceEl.textContent = frais.toLocaleString('fr-FR') + ' FCFA';
        prixTotalEl.textContent = total.toLocaleString('fr-FR') + ' FCFA';
    }

    // Écouteurs d'événements pour recalculer en temps réel
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
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Fermer le menu mobile si ouvert
                if (navMain && navMain.classList.contains('active')) {
                    navMain.classList.remove('active');
                    btnMenuMobile.textContent = '☰';
                }
            }
        });

            // ==========================================
    // 5. ENVOI DU FORMULAIRE VERS GOOGLE APPS SCRIPT
    // ==========================================
    const formBillet = document.getElementById('formBillet');
    
    if (formBillet) {
        formBillet.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 1. Afficher un indicateur de chargement
            const btnSubmit = formBillet.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = '🔄 Génération du billet en cours...';
            btnSubmit.disabled = true;

            // 2. Récupérer les valeurs du formulaire
            const siteSelect = document.getElementById('siteChoisi');
            const nomSite = siteSelect.options[siteSelect.selectedIndex].text;
            
            // Récupération sécurisée des champs (avec fallback si vide)
            const nomVisiteur = document.getElementById('nomVisiteur')?.value || 'Visiteur';
            const emailVisiteur = document.getElementById('emailVisiteur')?.value || '';
            const telVisiteur = document.getElementById('telVisiteur')?.value || '';
            const typeBillet = document.getElementById('typeBillet').value;
            const dateVisite = document.getElementById('dateVisite').value;
            const heure = document.getElementById('creneau').value;
            const prixTotal = document.getElementById('prixTotal').textContent.replace(' FCFA', '').replace(/\s/g, '');

            const data = {
                nomVisiteur: nomVisiteur,
                email: emailVisiteur,
                telephone: telVisiteur,
                nomSite: nomSite,
                numBillet: 'OUD-' + Date.now().toString().slice(-6), // ID unique court (ex: OUD-123456)
                typeBillet: typeBillet,
                dateVisite: dateVisite,
                heure: heure,
                prix: prixTotal
            };

            // 3. VOTRE URL DE DÉPLOIEMENT WEB APP
            const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxi5Y2_6g-8R6nKp3WzwWkxZyatiT0_A8gC1P3593jFZfgWjJI3evTSGCqfHNX9loZ7/exec';

            // 4. Envoi des données
            fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    alert('✅ Succès ! Votre billet a été généré et envoyé par email.');
                    
                    // Proposer l'envoi WhatsApp
                    if (result.whatsappLink && telVisiteur) {
                        if (confirm('Voulez-vous ouvrir WhatsApp pour envoyer le lien du billet au visiteur ?')) {
                            window.open(result.whatsappLink, '_blank');
                        }
                    }
                    
                    // Réinitialiser le formulaire
                    formBillet.reset();
                    document.getElementById('sousTotal').textContent = '0 FCFA';
                    document.getElementById('fraisService').textContent = '0 FCFA';
                    document.getElementById('prixTotal').textContent = '0 FCFA';
                } else {
                    alert('❌ Erreur : ' + result.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('❌ Une erreur de connexion est survenue. Vérifiez votre connexion internet.');
            })
            .finally(() => {
                // Rétablir le bouton
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
            });
        });
    }
    });

    console.log('✅ OUIDAH CONNECT Frontend initialisé avec succès');
});