/* =====================================================================
   OFFICE-FLASH 365 — Chatbot widget (frontend only, OpenRouter)
   ---------------------------------------------------------------------
   ⚠️⚠️⚠️  AVERTISSEMENT DE SÉCURITÉ  ⚠️⚠️⚠️
   Cette version appelle OpenRouter DIRECTEMENT depuis le navigateur.
   Votre clé API sera VISIBLE par tout visiteur du site.
   → À utiliser UNIQUEMENT pour du test / prototype local.
   → NE PAS déployer en production tel quel. Pour la prod, passer par
     un proxy backend (Cloudflare Worker / Netlify Function / Node).
   ===================================================================== */

(function () {
  'use strict';

  // =====================================================================
  // ⚙️  CONFIGURATION — PERSONNALISE ICI
  // =====================================================================
  const CONFIG = {
    // 🔑 Clé API OpenRouter (à remplacer par la tienne)
    //    https://openrouter.ai/keys
    API_KEY: 'VOTRE_CLE_ICI',

    // 🤖 Modèle IA (voir https://openrouter.ai/models)
    //    Exemples gratuits : 'meta-llama/llama-3.1-8b-instruct:free',
    //    'mistralai/mistral-7b-instruct:free', 'google/gemma-2-9b-it:free'
    //    Modèles payants plus puissants : 'openai/gpt-4o-mini',
    //    'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'
    MODEL: 'meta-llama/llama-3.1-8b-instruct:free',

    // 💬 Identité du bot (affichée dans le header)
    BOT_NAME: 'Assistant Office-flash 365',
    BOT_INITIALS: 'OF',

    // 👋 Message d'accueil
    WELCOME_MESSAGE:
      "Bonjour 👋 Je suis l'assistant d'Office-flash 365. " +
      "Je peux vous renseigner sur nos formations Microsoft 365, " +
      "les tarifs, la localisation à Bingerville, ou vous aider à réserver une session. " +
      "Comment puis-je vous aider aujourd'hui ?",

    // 🧠 Prompt système — comportement de l'assistant commercial
    SYSTEM_PROMPT: `Tu es l'assistant commercial virtuel d'Office-flash 365, un expert certifié Microsoft Office 365 basé à Bingerville, dans le District d'Abidjan (Côte d'Ivoire).

RÔLE :
- Tu accueilles les visiteurs du site vitrine et réponds à leurs questions sur les formations.
- Tu es poli, chaleureux, professionnel et concis (réponses courtes de 2 à 5 phrases maximum, sauf si on te demande des détails).
- Tu parles TOUJOURS en français.

OFFRES PROPOSÉES :
1. Excel Pro — tableaux croisés dynamiques, formules avancées (RECHERCHEX, LAMBDA), automatisation VBA / Power Query
2. Word & PowerPoint — documents administratifs professionnels, publipostage, présentations à fort impact
3. Collaboration Cloud — Microsoft Teams, OneDrive, SharePoint
Formats : coaching individuel, formation en entreprise sur site, sessions en ligne.

INFOS PRATIQUES :
- Localisation : Bingerville, à 15 mètres du supermarché Bon Prix. Intervention dans tout le District d'Abidjan (Cocody, Plateau, Riviera, Yopougon, Abobo, Treichville, Marcory…).
- Téléphone / WhatsApp : +225 07 48 22 22 75
- Email : bosscreation33@gmail.com
- Disponibilité : 7j/7, français, 100% pratique.

COMPORTEMENT :
- Si on te demande un tarif précis, explique que les tarifs dépendent du programme et du format, et invite à demander un devis gratuit par téléphone, WhatsApp ou email.
- Si on te demande de réserver, oriente vers le bouton "S'inscrire à une session" ou le numéro WhatsApp.
- Si la question sort totalement du domaine (ex : politique, cuisine), redirige poliment vers le sujet : les formations Microsoft 365.
- Ne donne JAMAIS d'informations que tu n'as pas. Si tu ne sais pas, dis-le et invite à contacter directement.
- Termine souvent par une question pour engager la conversation.`,

    // ⚙️ Paramètres génération
    TEMPERATURE: 0.7,
    MAX_TOKENS: 400,
    MAX_HISTORY: 10, // messages conservés dans le contexte
  };
  // =====================================================================

  // ---------------------------------------------------------------------
  // Construction du DOM (widget complet injecté dans <body>)
  // ---------------------------------------------------------------------
  const root = document.createElement('div');
  root.id = 'ofb-root';
  root.innerHTML = `
    <button class="ofb-toggle" aria-label="Ouvrir l'assistant" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div class="ofb-panel" role="dialog" aria-label="Assistant Office-flash 365">
      <div class="ofb-header">
        <div class="ofb-avatar">${CONFIG.BOT_INITIALS}</div>
        <div class="ofb-title">
          <strong>${CONFIG.BOT_NAME}</strong>
          <span><i class="ofb-dot"></i> En ligne</span>
        </div>
        <button class="ofb-close" aria-label="Fermer" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <div class="ofb-messages" id="ofb-messages"></div>

      <form class="ofb-form" id="ofb-form" autocomplete="off">
        <textarea class="ofb-input" id="ofb-input" rows="1"
          placeholder="Écrivez votre message..." maxlength="1000"></textarea>
        <button class="ofb-send" type="submit" aria-label="Envoyer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
          </svg>
        </button>
      </form>
      <div class="ofb-footer">Propulsé par IA — réponses indicatives</div>
    </div>
  `;
  document.body.appendChild(root);

  // ---------------------------------------------------------------------
  // Références DOM
  // ---------------------------------------------------------------------
  const toggleBtn  = root.querySelector('.ofb-toggle');
  const closeBtn   = root.querySelector('.ofb-close');
  const panel      = root.querySelector('.ofb-panel');
  const messagesEl = root.querySelector('#ofb-messages');
  const form       = root.querySelector('#ofb-form');
  const input      = root.querySelector('#ofb-input');
  const sendBtn    = form.querySelector('.ofb-send');

  // Historique de la conversation (envoyé à OpenRouter)
  const history = [];

  // ---------------------------------------------------------------------
  // Ouvrir / fermer
  // ---------------------------------------------------------------------
  const open  = () => { root.classList.add('ofb-open'); setTimeout(() => input.focus(), 300); };
  const close = () => { root.classList.remove('ofb-open'); };
  toggleBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // ---------------------------------------------------------------------
  // Affichage des messages
  // ---------------------------------------------------------------------
  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ofb-msg ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'ofb-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(t);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return t;
  }

  // Message d'accueil initial
  addMessage('bot', CONFIG.WELCOME_MESSAGE);

  // ---------------------------------------------------------------------
  // Auto-resize du textarea
  // ---------------------------------------------------------------------
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  });

  // Envoi avec Entrée (Shift+Entrée = saut de ligne)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  // ---------------------------------------------------------------------
  // Appel OpenRouter
  // ---------------------------------------------------------------------
  async function callOpenRouter(userMessage) {
    // On garde l'historique limité pour éviter de payer trop de tokens
    const trimmedHistory = history.slice(-CONFIG.MAX_HISTORY);

    const payload = {
      model: CONFIG.MODEL,
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS,
      messages: [
        { role: 'system', content: CONFIG.SYSTEM_PROMPT },
        ...trimmedHistory,
        { role: 'user', content: userMessage },
      ],
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.API_KEY,
        'Content-Type':  'application/json',
        // En-têtes recommandés par OpenRouter pour identifier l'origine
        'HTTP-Referer':  window.location.origin,
        'X-Title':       'Office-flash 365',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} — ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Réponse vide de l\'API');
    return reply;
  }

  // ---------------------------------------------------------------------
  // Soumission du formulaire
  // ---------------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return; // empêche l'envoi de messages vides

    // UI : message utilisateur + reset input
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    input.disabled = true;

    // Indicateur "en train d'écrire"
    const typing = showTyping();

    try {
      const reply = await callOpenRouter(text);
      typing.remove();
      addMessage('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      typing.remove();
      console.error('[Chatbot] Erreur OpenRouter :', err);
      addMessage(
        'error',
        "Désolé, je n'arrive pas à répondre pour le moment. " +
        "Vous pouvez nous joindre directement sur WhatsApp au +225 07 48 22 22 75."
      );
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });
})();
