/**
 * Tamaki Studio-Lite v1.0.0
 * Ultra-lightweight Writing Studio for Tamaki Pazuzu Style
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. Constants & Default Dictionaries
  // =========================================================================
  const DEFAULT_DICT = [
    { pattern: 'マークIIプレミオ', replacement: '90年代の国産セダン' },
    { pattern: 'マークⅡプレミオ', replacement: '90年代の国産セダン' },
    { pattern: 'HOTEL 伊丹', replacement: '郊外のビジネスホテル' },
    { pattern: 'ホテル伊丹', replacement: '郊外のビジネスホテル' },
    { pattern: 'ハイエース', replacement: 'ワンボックス車' },
    { pattern: 'セルシオ', replacement: '旧型高級セダン' },
    { pattern: 'シーマ', replacement: '旧型高級セダン' },
    { pattern: 'プリンスホテル', replacement: '都内の老舗ホテル' }
  ];

  const STORAGE_KEYS = {
    GENRE: 'tamaki_lite_genre',
    DETOX_HISTORY: 'tamaki_lite_detox_history',
    WRITING_SNAPSHOTS: 'tamaki_lite_snapshots',
    TUNING: 'tamaki_lite_tuning',
    API_KEY: 'tamaki_gemini_api_key',
    API_MODEL: 'tamaki_gemini_model',
    CUSTOM_DICT: 'tamaki_lite_custom_dict',
    DRAFT_CONTENT: 'tamaki_lite_draft_content',
    WRITING_CONTENT: 'tamaki_lite_writing_content',
    ESSAY_DATA: 'tamaki_lite_form_essay',
    SUBCULTURE_DATA: 'tamaki_lite_form_subculture',
    NOVEL_DATA: 'tamaki_lite_form_novel'
  };

  const TUNING_LABELS = {
    tone: { 1: '冷静・知性派 (クール)', 2: '標準 (バランス)', 3: '熱量全開 (自虐強め)' },
    meta: { 1: '控えめ', 2: '標準', 3: '鋭いメタ認知' },
    turbulence: { 1: '直線的', 2: '標準', 3: '二転三転 (思考実験)' },
    detail: { 1: '抽象的', 2: '標準', 3: '生々しい固有名詞' },
    tempo: { 1: 'ゆったり', 2: 'テンポ軽快' }
  };

  // =========================================================================
  // 2. Application State
  // =========================================================================
  const state = {
    currentGenre: 'essay',
    mobileTab: 'input', // 'input' | 'draft' | 'writing'
    tuning: {
      tone: 2,
      meta: 3,
      turbulence: 3,
      detail: 3,
      tempo: 2,
      antiAi: true,
      delusion: false
    },
    customDict: [],
    detoxHistory: [],
    writingSnapshots: [],
    apiKey: '',
    apiModel: 'gemini-2.5-flash',
    undoStack: []
  };

  // =========================================================================
  // 3. DOM Element References
  // =========================================================================
  // Header
  const headerCharCount = document.getElementById('header-char-count');
  const btnOpenHistory = document.getElementById('btn-open-history');
  const btnOpenDict = document.getElementById('btn-open-dict');
  const btnOpenApi = document.getElementById('btn-open-api');
  const btnOpenBackup = document.getElementById('btn-open-backup');
  const btnLaunchV4 = document.getElementById('btn-launch-v4');

  // Genre Tabs & Forms
  const genreTabs = document.querySelectorAll('.genre-tab');
  const fieldsEssay = document.getElementById('fields-essay');
  const fieldsSubculture = document.getElementById('fields-subculture');
  const fieldsNovel = document.getElementById('fields-novel');

  // Detox Scrapbook
  const detoxInput = document.getElementById('detox-input');
  const detoxCharCount = document.getElementById('detox-char-count');
  const detoxHistoryDropdown = document.getElementById('detox-history-dropdown');
  const btnSendDetoxEssay = document.getElementById('btn-send-detox-essay');
  const btnSendDetoxSubculture = document.getElementById('btn-send-detox-subculture');
  const btnSendDetoxNovel = document.getElementById('btn-send-detox-novel');

  // Form Inputs
  const essayTheme = document.getElementById('essay-theme');
  const essayExp = document.getElementById('essay-experience');
  const essayInsight = document.getElementById('essay-insight');
  const essayEnding = document.getElementById('essay-ending');

  const subcultureTarget = document.getElementById('subculture-target');
  const subcultureDoubts = document.getElementById('subculture-doubts');
  const subcultureInsight = document.getElementById('subculture-insight');
  const subcultureEnding = document.getElementById('subculture-ending');

  const novelSetting = document.getElementById('novel-setting');
  const novelFlow = document.getElementById('novel-flow');
  const novelSensory = document.getElementById('novel-sensory');
  const novelEnding = document.getElementById('novel-ending');

  // Tuning Sliders
  const sliderTone = document.getElementById('slider-tone');
  const sliderMeta = document.getElementById('slider-meta');
  const sliderTurbulence = document.getElementById('slider-turbulence');
  const sliderDetail = document.getElementById('slider-detail');
  const sliderTempo = document.getElementById('slider-tempo');
  const toggleAntiAi = document.getElementById('toggle-anti-ai');
  const toggleDelusion = document.getElementById('toggle-delusion');
  const valTone = document.getElementById('val-tone');
  const valMeta = document.getElementById('val-meta');
  const valTurbulence = document.getElementById('val-turbulence');
  const valDetail = document.getElementById('val-detail');
  const valTempo = document.getElementById('val-tempo');
  const btnResetTuning = document.getElementById('btn-reset-tuning');

  // Action Button
  const btnGenerateDraft = document.getElementById('btn-generate-draft');

  // Two-tiered Studio: Draft & Writing
  const panelInput = document.getElementById('panel-input');
  const panelEditor = document.getElementById('panel-editor');
  const blockDraft = document.querySelector('.block-draft');
  const blockWriting = document.querySelector('.block-writing');
  const draftOutput = document.getElementById('draft-output');
  const writingCanvas = document.getElementById('writing-canvas');
  const writingCharCount = document.getElementById('writing-char-count');
  const writingReadTime = document.getElementById('writing-read-time');

  const btnCopyDraft = document.getElementById('btn-copy-draft');
  const btnInjectToWriting = document.getElementById('btn-inject-to-writing');
  const btnReplaceWriting = document.getElementById('btn-replace-writing');
  const btnClearDraft = document.getElementById('btn-clear-draft');

  const btnMakeProofreadPrompt = document.getElementById('btn-make-proofread-prompt');
  const btnAnonymizeDict = document.getElementById('btn-anonymize-dict');
  const btnDownloadMd = document.getElementById('btn-download-md');
  const btnCopyWriting = document.getElementById('btn-copy-writing');
  const btnClearWriting = document.getElementById('btn-clear-writing');

  // Mobile Assist & Bottom Nav
  const quickAssistBar = document.getElementById('quick-assist-bar');
  const btnAssistCopy = document.getElementById('btn-assist-copy');
  const btnAssistProofread = document.getElementById('btn-assist-proofread');
  const btnAssistUndo = document.getElementById('btn-assist-undo');
  const mobileNavTabs = document.querySelectorAll('.nav-tab');

  // Modals
  const modalHistory = document.getElementById('modal-history');
  const modalDict = document.getElementById('modal-dict');
  const modalApi = document.getElementById('modal-api');
  const modalBackup = document.getElementById('modal-backup');
  const closeButtons = document.querySelectorAll('[data-close-modal]');

  // History Modal Elements
  const tabHistDetox = document.getElementById('tab-hist-detox');
  const tabHistWriting = document.getElementById('tab-hist-writing');
  const historyListContent = document.getElementById('history-list-content');
  const btnSaveCurrentSnapshot = document.getElementById('btn-save-current-snapshot');
  const btnClearAllHistory = document.getElementById('btn-clear-all-history');

  // Privacy Dict Elements
  const dictInputPattern = document.getElementById('dict-input-pattern');
  const dictInputReplacement = document.getElementById('dict-input-replacement');
  const btnAddDictEntry = document.getElementById('btn-add-dict-entry');
  const dictTableBody = document.getElementById('dict-table-body');
  const btnExecDictReplace = document.getElementById('btn-exec-dict-replace');

  // API Modal Elements & Standalone Card Elements
  const apiKeyInput = document.getElementById('api-key-input');
  const apiModelSelect = document.getElementById('api-model-select');
  const btnFetchModels = document.getElementById('btn-fetch-models');
  const modelFetchStatus = document.getElementById('model-fetch-status');
  const btnSaveApiKey = document.getElementById('btn-save-api-key');
  const btnRemoveApiKey = document.getElementById('btn-remove-api-key');

  // Standalone API Card Elements (Left Panel)
  const cardApiStandalone = document.getElementById('card-api-standalone');
  const headerApiToggle = document.getElementById('header-api-toggle');
  const btnToggleApiCard = document.getElementById('btn-toggle-api-card');
  const apiCardContent = document.getElementById('api-card-content');
  const apiStatusBadge = document.getElementById('api-status-badge');
  const quickApiKey = document.getElementById('quick-api-key');
  const quickApiModel = document.getElementById('quick-api-model');
  const btnQuickFetchModels = document.getElementById('btn-quick-fetch-models');
  const quickModelStatus = document.getElementById('quick-model-status');
  const btnQuickSaveApi = document.getElementById('btn-quick-save-api');
  const btnQuickRemoveApi = document.getElementById('btn-quick-remove-api');
  const actionHintText = document.getElementById('action-hint-text');

  // Backup Modal Elements
  const btnExportBackupJson = document.getElementById('btn-export-backup-json');
  const btnTriggerImportJson = document.getElementById('btn-trigger-import-json');
  const backupFileInput = document.getElementById('backup-file-input');

  // Overlays & Notifications
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const toastMessage = document.getElementById('toast-message');

  // =========================================================================
  // 4. Utility Functions
  // =========================================================================
  function showToast(msg) {
    if (!toastMessage) return;
    toastMessage.textContent = msg;
    toastMessage.classList.remove('hidden');
    clearTimeout(toastMessage._timer);
    toastMessage._timer = setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 2800);
  }

  function showLoading(msg = '処理中...') {
    if (loadingText) loadingText.textContent = msg;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }

  function updateCharCounts() {
    const text = writingCanvas ? writingCanvas.value : '';
    const length = text.length;
    if (writingCharCount) writingCharCount.textContent = length.toLocaleString();
    if (headerCharCount) headerCharCount.textContent = length.toLocaleString();
    if (writingReadTime) {
      const minutes = Math.ceil(length / 500) || 0;
      writingReadTime.textContent = minutes;
    }

    if (detoxInput && detoxCharCount) {
      detoxCharCount.textContent = `${detoxInput.value.length.toLocaleString()} 字`;
    }
  }

  function saveUndoState() {
    if (!writingCanvas) return;
    state.undoStack.push(writingCanvas.value);
    if (state.undoStack.length > 30) state.undoStack.shift();
  }

  // =========================================================================
  // 5. LocalStorage Persistence
  // =========================================================================
  function loadStoredData() {
    try {
      // Genre
      const savedGenre = localStorage.getItem(STORAGE_KEYS.GENRE);
      if (savedGenre && ['essay', 'subculture', 'novel'].includes(savedGenre)) {
        setGenre(savedGenre, false);
      }

      // Tuning
      const savedTuning = localStorage.getItem(STORAGE_KEYS.TUNING);
      if (savedTuning) {
        state.tuning = Object.assign(state.tuning, JSON.parse(savedTuning));
        applyTuningToUI();
      }

      // API Key & Model
      state.apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
      state.apiModel = localStorage.getItem(STORAGE_KEYS.API_MODEL) || 'gemini-2.5-flash';
      if (apiKeyInput) apiKeyInput.value = state.apiKey;
      if (apiModelSelect) apiModelSelect.value = state.apiModel;

      // Custom Dict
      const savedDict = localStorage.getItem(STORAGE_KEYS.CUSTOM_DICT);
      state.customDict = savedDict ? JSON.parse(savedDict) : [];
      renderDictTable();

      // Detox History
      const savedDetox = localStorage.getItem(STORAGE_KEYS.DETOX_HISTORY);
      state.detoxHistory = savedDetox ? JSON.parse(savedDetox) : [];
      renderDetoxDropdown();

      // Writing Snapshots
      const savedSnapshots = localStorage.getItem(STORAGE_KEYS.WRITING_SNAPSHOTS);
      state.writingSnapshots = savedSnapshots ? JSON.parse(savedSnapshots) : [];

      // Editor Contents
      const savedDraft = localStorage.getItem(STORAGE_KEYS.DRAFT_CONTENT);
      if (savedDraft && draftOutput) draftOutput.value = savedDraft;

      const savedWriting = localStorage.getItem(STORAGE_KEYS.WRITING_CONTENT);
      if (savedWriting && writingCanvas) writingCanvas.value = savedWriting;

      // Form inputs
      const essayData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ESSAY_DATA) || '{}');
      if (essayTheme) essayTheme.value = essayData.theme || '';
      if (essayExp) essayExp.value = essayData.exp || '';
      if (essayInsight) essayInsight.value = essayData.insight || '';
      if (essayEnding) essayEnding.value = essayData.ending || '';

      const subData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBCULTURE_DATA) || '{}');
      if (subcultureTarget) subcultureTarget.value = subData.target || '';
      if (subcultureDoubts) subcultureDoubts.value = subData.doubts || '';
      if (subcultureInsight) subcultureInsight.value = subData.insight || '';
      if (subcultureEnding) subcultureEnding.value = subData.ending || '';

      const novelData = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOVEL_DATA) || '{}');
      if (novelSetting) novelSetting.value = novelData.setting || '';
      if (novelFlow) novelFlow.value = novelData.flow || '';
      if (novelSensory) novelSensory.value = novelData.sensory || '';
      if (novelEnding) novelEnding.value = novelData.ending || '';

      updateCharCounts();
      syncApiStateToUI();
    } catch (e) {
      console.warn('Error loading storage:', e);
    }
  }

  function autoSaveInputs() {
    localStorage.setItem(STORAGE_KEYS.GENRE, state.currentGenre);
    localStorage.setItem(STORAGE_KEYS.TUNING, JSON.stringify(state.tuning));
    if (draftOutput) localStorage.setItem(STORAGE_KEYS.DRAFT_CONTENT, draftOutput.value);
    if (writingCanvas) localStorage.setItem(STORAGE_KEYS.WRITING_CONTENT, writingCanvas.value);

    // Save active forms
    localStorage.setItem(STORAGE_KEYS.ESSAY_DATA, JSON.stringify({
      theme: essayTheme ? essayTheme.value : '',
      exp: essayExp ? essayExp.value : '',
      insight: essayInsight ? essayInsight.value : '',
      ending: essayEnding ? essayEnding.value : ''
    }));

    localStorage.setItem(STORAGE_KEYS.SUBCULTURE_DATA, JSON.stringify({
      target: subcultureTarget ? subcultureTarget.value : '',
      doubts: subcultureDoubts ? subcultureDoubts.value : '',
      insight: subcultureInsight ? subcultureInsight.value : '',
      ending: subcultureEnding ? subcultureEnding.value : ''
    }));

    localStorage.setItem(STORAGE_KEYS.NOVEL_DATA, JSON.stringify({
      setting: novelSetting ? novelSetting.value : '',
      flow: novelFlow ? novelFlow.value : '',
      sensory: novelSensory ? novelSensory.value : '',
      ending: novelEnding ? novelEnding.value : ''
    }));
  }

  // =========================================================================
  // 6. Genre Switching & Detox Routing (要件1, 2)
  // =========================================================================
  function setGenre(genre, notify = true) {
    state.currentGenre = genre;
    genreTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-genre') === genre);
    });

    if (fieldsEssay) fieldsEssay.classList.toggle('hidden', genre !== 'essay');
    if (fieldsSubculture) fieldsSubculture.classList.toggle('hidden', genre !== 'subculture');
    if (fieldsNovel) fieldsNovel.classList.toggle('hidden', genre !== 'novel');

    autoSaveInputs();
    if (notify) {
      const names = { essay: '日常エッセイ', subculture: 'ガンダム・論考', novel: '小説・官能' };
      showToast(`ジャンルを「${names[genre]}」に切り替えました`);
    }
  }

  genreTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setGenre(tab.getAttribute('data-genre'));
    });
  });

  // Detox History
  function saveDetoxToHistory(text) {
    if (!text || !text.trim()) return;
    const item = {
      id: Date.now(),
      date: new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      text: text.trim()
    };
    state.detoxHistory.unshift(item);
    if (state.detoxHistory.length > 30) state.detoxHistory.pop();
    localStorage.setItem(STORAGE_KEYS.DETOX_HISTORY, JSON.stringify(state.detoxHistory));
    renderDetoxDropdown();
  }

  function renderDetoxDropdown() {
    if (!detoxHistoryDropdown) return;
    detoxHistoryDropdown.innerHTML = `<option value="">📜 過去の落書き (${state.detoxHistory.length}件)...</option>`;
    state.detoxHistory.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      const preview = item.text.replace(/\n/g, ' ').substring(0, 20);
      opt.textContent = `[${item.date}] ${preview}...`;
      detoxHistoryDropdown.appendChild(opt);
    });
  }

  if (detoxHistoryDropdown) {
    detoxHistoryDropdown.addEventListener('change', (e) => {
      const id = Number(e.target.value);
      const found = state.detoxHistory.find(i => i.id === id);
      if (found && detoxInput) {
        detoxInput.value = found.text;
        updateCharCounts();
        showToast('📜 過去の落書きを復元しました');
      }
      e.target.value = '';
    });
  }

  // Send Detox to Specific Genre (要件1: 便所の落書きをエッセイ、ガンダム、小説へ振り分け)
  function sendDetoxToGenre(targetGenre) {
    const text = detoxInput ? detoxInput.value.trim() : '';
    if (!text) {
      showToast('落書きが空です。感情やメモを入力してください');
      return;
    }

    saveDetoxToHistory(text);

    if (targetGenre === 'essay') {
      if (essayExp) {
        essayExp.value = essayExp.value ? `${essayExp.value}\n\n【落書きメモ】\n${text}` : text;
      }
      if (essayTheme && !essayTheme.value) {
        essayTheme.value = text.split('\n')[0].replace(/^[・\s\-]+/, '').substring(0, 30);
      }
      setGenre('essay', false);
      showToast('🚀 落書きを履歴保存し、日常エッセイの体験欄へ展開しました！');
      if (essayExp) essayExp.focus();
    } else if (targetGenre === 'subculture') {
      if (subcultureDoubts) {
        subcultureDoubts.value = subcultureDoubts.value ? `${subcultureDoubts.value}\n\n【落書きメモ】\n${text}` : text;
      }
      if (subcultureTarget && !subcultureTarget.value) {
        subcultureTarget.value = text.split('\n')[0].replace(/^[・\s\-]+/, '').substring(0, 30);
      }
      setGenre('subculture', false);
      showToast('🤖 落書きを履歴保存し、ガンダム論考の違和感欄へ展開しました！');
      if (subcultureDoubts) subcultureDoubts.focus();
    } else if (targetGenre === 'novel') {
      if (novelFlow) {
        novelFlow.value = novelFlow.value ? `${novelFlow.value}\n\n【落書きメモ】\n${text}` : text;
      }
      if (novelSetting && !novelSetting.value) {
        novelSetting.value = text.split('\n')[0].replace(/^[・\s\-]+/, '').substring(0, 30);
      }
      setGenre('novel', false);
      showToast('📖 落書きを履歴保存し、小説・官能のプロット欄へ展開しました！');
      if (novelFlow) novelFlow.focus();
    }

    autoSaveInputs();
  }

  if (btnSendDetoxEssay) {
    btnSendDetoxEssay.addEventListener('click', () => sendDetoxToGenre('essay'));
  }
  if (btnSendDetoxSubculture) {
    btnSendDetoxSubculture.addEventListener('click', () => sendDetoxToGenre('subculture'));
  }
  if (btnSendDetoxNovel) {
    btnSendDetoxNovel.addEventListener('click', () => sendDetoxToGenre('novel'));
  }

  // =========================================================================
  // 7. Tuning Sliders (たまきぱずず度) (要件3)
  // =========================================================================
  function applyTuningToUI() {
    if (sliderTone) sliderTone.value = state.tuning.tone;
    if (sliderMeta) sliderMeta.value = state.tuning.meta;
    if (sliderTurbulence) sliderTurbulence.value = state.tuning.turbulence;
    if (sliderDetail) sliderDetail.value = state.tuning.detail;
    if (sliderTempo) sliderTempo.value = state.tuning.tempo;
    if (toggleAntiAi) toggleAntiAi.checked = state.tuning.antiAi;
    if (toggleDelusion) toggleDelusion.checked = state.tuning.delusion;

    if (valTone) valTone.textContent = TUNING_LABELS.tone[state.tuning.tone];
    if (valMeta) valMeta.textContent = TUNING_LABELS.meta[state.tuning.meta];
    if (valTurbulence) valTurbulence.textContent = TUNING_LABELS.turbulence[state.tuning.turbulence];
    if (valDetail) valDetail.textContent = TUNING_LABELS.detail[state.tuning.detail];
    if (valTempo) valTempo.textContent = TUNING_LABELS.tempo[state.tuning.tempo];
  }

  function setupSliderListeners() {
    const sliders = [
      { el: sliderTone, key: 'tone', labelEl: valTone, map: TUNING_LABELS.tone },
      { el: sliderMeta, key: 'meta', labelEl: valMeta, map: TUNING_LABELS.meta },
      { el: sliderTurbulence, key: 'turbulence', labelEl: valTurbulence, map: TUNING_LABELS.turbulence },
      { el: sliderDetail, key: 'detail', labelEl: valDetail, map: TUNING_LABELS.detail },
      { el: sliderTempo, key: 'tempo', labelEl: valTempo, map: TUNING_LABELS.tempo }
    ];

    sliders.forEach(s => {
      if (s.el) {
        s.el.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          state.tuning[s.key] = val;
          if (s.labelEl && s.map) s.labelEl.textContent = s.map[val];
          autoSaveInputs();
        });
      }
    });

    if (toggleAntiAi) {
      toggleAntiAi.addEventListener('change', (e) => {
        state.tuning.antiAi = e.target.checked;
        autoSaveInputs();
      });
    }

    if (toggleDelusion) {
      toggleDelusion.addEventListener('change', (e) => {
        state.tuning.delusion = e.target.checked;
        autoSaveInputs();
      });
    }

    if (btnResetTuning) {
      btnResetTuning.addEventListener('click', () => {
        state.tuning = { tone: 2, meta: 3, turbulence: 3, detail: 3, tempo: 2, antiAi: true, delusion: false };
        applyTuningToUI();
        autoSaveInputs();
        showToast('チューニングを初期値にリセットしました');
      });
    }
  }

  // =========================================================================
  // 8. Prompt Builder Engine (たまきぱずずペルソナ・文体再現)
  // =========================================================================
  function buildDraftPrompt() {
    const genre = state.currentGenre;
    const tuning = state.tuning;

    // Tuning instructions
    let toneText = tuning.tone === 1 
      ? '【文体トーン：冷静・知性派】過度な自虐やテンションを抑え、理知的で落ち着いた大人の語り口。'
      : tuning.tone === 3 
        ? '【文体トーン：熱量全開】鋭い自虐、感情の揺れ、強烈なセルフツッコミを前面に出し人間味溢れる熱いテンション。'
        : '【文体トーン：標準バランス】等身大の知性と適度な自虐・セルフツッコミを交え、親しみやすくユーモラス。';

    let metaText = tuning.meta === 3
      ? '【最重要：鋭いメタ認知】自分の見栄、衝動買い、失敗談、未熟さを一段上から冷静に観察し、セルフツッコミをユーモラスに入れること。'
      : '【客観的視座】適度に自己を客観視しつつ、大人の分別を保つこと。';

    let turbText = tuning.turbulence === 3
      ? '【思考の迷走プロセス】一直線の綺麗すぎる論理展開ではなく、「調べる → 違和感に気づく → 仮説を立てる → いや待てよと立ち止まる」という生々しい試行錯誤を残すこと。'
      : '【論理構成】無理な脱線を避け、筋道の通った構成にすること。';

    let detailText = tuning.detail === 3
      ? '【生々しい解像度】抽象論を徹底排除し、具体的な商品名、気温・湿度、皮膚感覚、金額、現場の生々しいディテールを描くこと。'
      : '【標準的解像度】要点を押さえた具体例を適宜配置すること。';

    let antiAiRules = tuning.antiAi ? `
【厳格なAI臭さ排除ルール】
- 「〜ではないでしょうか」「いかがでしたでしょうか」「ぜひ参考にしてみてください」などの陳腐な結びは厳禁。
- 読者を啓発したり上から目線で教訓を垂れ流さないこと。
- 「まとめ」「終わりに」といった優等生的な見出しは不要。
- 物語の着地は、自虐や日常への静かな回帰など、軽やかなオチで締めること。
` : '';

    let prompt = '';

    if (genre === 'essay') {
      prompt = `# 指示
あなたは文筆家・エッセイスト「たまきぱずず」です。
以下の【インプット情報】をもとに、読者を引き込み、深い共感と軽快なオチを残すnote向けエッセイを作成してください。

---

## 1. 執筆スタンス＆チューニング
- ${toneText}
- ${metaText}
- ${turbText}
- ${detailText}
- テンポ：${tuning.tempo === 2 ? '1〜2文ごとに適度に改行を挟み、スマホでテンポよく読めるリズム感。' : '落ち着いた段落構成。'}
${antiAiRules}
- 【絶対禁止】：ガンダムネタ・宇宙世紀用語・富野由悠季の話題は指示がない限り一切入れないこと。
- 【絶対禁止】：安直に「またAmazonでポチる」といった陳腐な物欲オチで逃げないこと。

---

## 2. 記事構成（4段構成）
1. 【導入・ツカミ】：意表を突くフックや、日常のふとした違和感
2. 【展開・実体験】：実際に試したこと、失敗談、身体感覚と固有名詞
3. 【深掘り・考察】：なぜそうなったのか？構造と本質の考察
4. 【結び・オチ】：自虐セルフツッコミや、日常への軽やかな着地

---

## 3. インプット情報
- テーマ・導入：${essayTheme ? essayTheme.value.trim() : '（日常の違和感・体験）'}
- 実体験・ディテール：
${essayExp ? essayExp.value.trim() : '（具体的な試行錯誤メモ）'}
- 本質考察：${essayInsight ? essayInsight.value.trim() : '（構造の分析）'}
- 結び・オチ：${essayEnding ? essayEnding.value.trim() : '（軽妙な自虐着地）'}

以上の指示に従い、完成度の高いエッセイ本文を出力してください。`;

    } else if (genre === 'subculture') {
      prompt = `# 指示
あなたは宇宙世紀原理主義・サブカルチャー評論家「たまきぱずず」です。
以下の【インプット情報】をもとに、オールドタイプ視点の違和感とSF技術的・商業的考察を交えた重厚かつ軽快な論考記事を作成してください。

---

## 1. 執筆スタンス＆チューニング
- ${toneText}
- ${metaText}
- ${turbText}
- ${detailText}
- スタンス：看板(IP)に惑わされず、作品の構造、当時の時代背景、一兵卒視点の泥臭いリアリズムを追究する。
${antiAiRules}
- 結び：「完全に富野御大の掌の上」「今夜は大人しく積みプラのバリでも削る」といった老害オタクの愛ある自虐着地。

---

## 2. インプット情報
- 対象作品・トピック：${subcultureTarget ? subcultureTarget.value.trim() : '（ガンダム作品等）'}
- 感じた違和感・本音 / 思考実験：
${subcultureDoubts ? subcultureDoubts.value.trim() : '（率直な疑問・本音）'}
- 深掘りしたい論点・考察：
${subcultureInsight ? subcultureInsight.value.trim() : '（構造・背景分析）'}
- 結びのトーン：${subcultureEnding ? subcultureEnding.value.trim() : '（老害オタクの自虐着地）'}

以上の指示に従い、骨太で読み応えのある論考本文を出力してください。`;

    } else { // novel
      prompt = `# 指示
あなたは鋭い心理観察と微熱を帯びた情緒を描く作家「たまきぱずず」です。
以下の【インプット情報】をもとに、大人の心理サスペンス・官能の機微を描いた小説本文を作成してください。

---

## 1. 執筆スタンス＆チューニング
- ${toneText}
- ${metaText}
- ${detailText}
- 描写の核：直接的で露骨な性的表現を避け、「微熱」「皮膚の質感」「衣擦れの音」「沈黙の重さ」「呼吸の乱れ」など五感と心理のグラデーションで魅せること。
${antiAiRules}

---

## 2. インプット情報
- 場面設定・人物：${novelSetting ? novelSetting.value.trim() : '（設定）'}
- 感情の揺れ・プロット：
${novelFlow ? novelFlow.value.trim() : '（展開メモ）'}
- 官能・心理描写の核：${novelSensory ? novelSensory.value.trim() : '（五感描写）'}
- 結末・余韻：${novelEnding ? novelEnding.value.trim() : '（余韻の方向性）'}

以上の指示に従い、文学的品格と張り詰めた緊張感のある短編小説を出力してください。`;
    }

    return prompt;
  }

  // =========================================================================
  // 9. Generate Draft Action (要件4: 筆者風たたき台を作る)
  // =========================================================================
  async function generateDraft() {
    const prompt = buildDraftPrompt();

    // If Gemini API Key is available, directly call Gemini API
    if (state.apiKey) {
      showLoading('Gemini APIで筆者風たたき台を生成中...');
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 3500
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!outputText) throw new Error('生成されたテキストが空でした');

        if (draftOutput) draftOutput.value = outputText;
        autoSaveInputs();
        hideLoading();
        showToast('⚡ 筆者風たたき台を生成しました！');

        // Switch to draft view on mobile
        if (window.innerWidth <= 768) {
          switchMobileTab('draft');
        }
      } catch (err) {
        hideLoading();
        console.error('Gemini API Error:', err);
        // Fallback: put prompt into draft area
        if (draftOutput) draftOutput.value = prompt;
        autoSaveInputs();
        showToast(`APIエラー: ${err.message}。プロンプトを配置しました`);
        if (window.innerWidth <= 768) switchMobileTab('draft');
      }
    } else {
      // No API key: put prompt into draft area & copy to clipboard
      if (draftOutput) draftOutput.value = prompt;
      autoSaveInputs();
      navigator.clipboard.writeText(prompt).then(() => {
        showToast('⚡ たたき台プロンプトを生成し、クリップボードにコピーしました！');
      }).catch(() => {
        showToast('⚡ たたき台プロンプトを生成しました');
      });

      if (window.innerWidth <= 768) {
        switchMobileTab('draft');
      }
    }
  }

  if (btnGenerateDraft) {
    btnGenerateDraft.addEventListener('click', generateDraft);
  }

  // =========================================================================
  // 10. Proofreading Prompt Generation (★新設要件: 原稿から推敲用プロンプト作成)
  // =========================================================================
  function makeProofreadPrompt() {
    const text = writingCanvas ? writingCanvas.value.trim() : '';
    if (!text) {
      showToast('執筆エリアが空です。原稿を執筆してから実行してください');
      return;
    }

    const genre = state.currentGenre;
    const tuning = state.tuning;

    const proofreadPrompt = `# 指示
あなたは文筆家「たまきぱずず」本人です。
以下の【推敲対象の原稿】を、筆者特有の文体美学とチューニング設定に従って、徹底的に推敲・ブラッシュアップした完成原稿を作成してください。

---

## 1. 推敲・リライトの重点方針
1. **メタ認知の深化**: 筆者の視座（自己客観視・セルフツッコミ）を鋭く研ぎ澄まし、かっこつけや優等生的な言い回しを人間味ある自虐・本音に書き直す。
2. **生々しい解像度とリズム**: 抽象的な表現を具体的な固有名詞・身体感覚に置き換え、テンポのよい改行・文体に整える。
3. **思考の迷走プロセス**: 結論に一直線に急ぎすぎている箇所があれば、「調べる → 引っかかる → 疑う → 立ち止まる」というライブ感ある試行錯誤を補強する。
4. **AI臭さ・綺麗事の完全排除**:
   - 教訓じみたまとめ、陳腐な啓発、優等生的な結論（「〜ではないでしょうか」「参考にしてみてください」）を完全に削ぎ落とす。
   - 結びは、大人の分別と軽妙なオチ・自虐で爽快に着地させる。
5. **文体トーン**: ${TUNING_LABELS.tone[tuning.tone]}

---

## 2. 推敲対象の原稿（ジャンル: ${genre === 'essay' ? '日常エッセイ' : genre === 'subculture' ? 'ガンダム・論考' : '小説・官能'}）

\`\`\`markdown
${text}
\`\`\`

---

以上の推敲ルールに基づき、ブラッシュアップされた完成原稿を出力してください。`;

    if (draftOutput) draftOutput.value = proofreadPrompt;
    autoSaveInputs();

    navigator.clipboard.writeText(proofreadPrompt).then(() => {
      showToast('🎯 原稿から推敲用プロンプトを作成し、コピーしました！');
    }).catch(() => {
      showToast('🎯 推敲用プロンプトを作成し、たたき台エリアに配置しました');
    });

    if (window.innerWidth <= 768) {
      switchMobileTab('draft');
    }
  }

  if (btnMakeProofreadPrompt) {
    btnMakeProofreadPrompt.addEventListener('click', makeProofreadPrompt);
  }
  if (btnAssistProofread) {
    btnAssistProofread.addEventListener('click', makeProofreadPrompt);
  }

  // =========================================================================
  // 11. Right Panel Studio Operations (Draft & Writing Canvas) (要件6)
  // =========================================================================
  // Copy Draft
  if (btnCopyDraft) {
    btnCopyDraft.addEventListener('click', () => {
      const text = draftOutput ? draftOutput.value : '';
      if (!text.trim()) return showToast('たたき台が空です');
      navigator.clipboard.writeText(text).then(() => showToast('📋 たたき台をコピーしました'));
    });
  }

  // Inject Draft to Writing Canvas
  if (btnInjectToWriting) {
    btnInjectToWriting.addEventListener('click', () => {
      const draft = draftOutput ? draftOutput.value.trim() : '';
      if (!draft) return showToast('たたき台が空です');
      saveUndoState();
      const current = writingCanvas.value;
      writingCanvas.value = current ? `${current}\n\n${draft}` : draft;
      updateCharCounts();
      autoSaveInputs();
      showToast('⬇️ たたき台を執筆エリアに流し込みました！');
      if (window.innerWidth <= 768) switchMobileTab('writing');
    });
  }

  // Replace Writing Canvas with Draft
  if (btnReplaceWriting) {
    btnReplaceWriting.addEventListener('click', () => {
      const draft = draftOutput ? draftOutput.value.trim() : '';
      if (!draft) return showToast('たたき台が空です');
      if (writingCanvas.value.trim() && !confirm('執筆エリアの内容をたたき台で全文置換しますか？')) return;
      saveUndoState();
      writingCanvas.value = draft;
      updateCharCounts();
      autoSaveInputs();
      showToast('🔄 執筆エリアをたたき台で全文置換しました！');
      if (window.innerWidth <= 768) switchMobileTab('writing');
    });
  }

  // Clear Draft
  if (btnClearDraft) {
    btnClearDraft.addEventListener('click', () => {
      if (!draftOutput.value.trim() || confirm('たたき台エリアをクリアしますか？')) {
        draftOutput.value = '';
        autoSaveInputs();
        showToast('たたき台をクリアしました');
      }
    });
  }

  // Copy Writing
  if (btnCopyWriting) {
    btnCopyWriting.addEventListener('click', () => {
      const text = writingCanvas ? writingCanvas.value : '';
      if (!text.trim()) return showToast('原稿が空です');
      navigator.clipboard.writeText(text).then(() => showToast('📋 原稿全文をコピーしました'));
    });
  }

  // Clear Writing
  if (btnClearWriting) {
    btnClearWriting.addEventListener('click', () => {
      if (!writingCanvas.value.trim() || confirm('執筆エリアの原稿をクリアしますか？')) {
        saveUndoState();
        writingCanvas.value = '';
        updateCharCounts();
        autoSaveInputs();
        showToast('執筆エリアをクリアしました');
      }
    });
  }

  // Download Markdown (要件・保持)
  if (btnDownloadMd) {
    btnDownloadMd.addEventListener('click', () => {
      const text = writingCanvas ? writingCanvas.value : '';
      if (!text.trim()) return showToast('保存する原稿がありません');
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `tamaki_lite_${state.currentGenre}_${dateStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📄 Markdownファイルをダウンロードしました');
    });
  }

  // Real-time Textarea Events
  if (writingCanvas) {
    writingCanvas.addEventListener('input', () => {
      updateCharCounts();
      autoSaveInputs();
    });
  }

  if (draftOutput) {
    draftOutput.addEventListener('input', () => {
      autoSaveInputs();
    });
  }

  if (detoxInput) {
    detoxInput.addEventListener('input', () => {
      updateCharCounts();
    });
  }

  // Auto-save form inputs
  [essayTheme, essayExp, essayInsight, essayEnding,
   subcultureTarget, subcultureDoubts, subcultureInsight, subcultureEnding,
   novelSetting, novelFlow, novelSensory, novelEnding].forEach(el => {
    if (el) el.addEventListener('input', autoSaveInputs);
  });

  // =========================================================================
  // 12. Privacy Dictionary (身バレ置換辞書) (要件・保持)
  // =========================================================================
  function getMergedDict() {
    return [...DEFAULT_DICT, ...state.customDict];
  }

  function renderDictTable() {
    if (!dictTableBody) return;
    dictTableBody.innerHTML = '';
    const dict = getMergedDict();
    dict.forEach((entry, idx) => {
      const isCustom = idx >= DEFAULT_DICT.length;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${escapeHtml(entry.pattern)}</code></td>
        <td><code>${escapeHtml(entry.replacement)}</code></td>
        <td>
          ${isCustom ? `<button type="button" class="btn-text-xs btn-del-dict" data-custom-idx="${idx - DEFAULT_DICT.length}">削除</button>` : '<span class="text-subtle" style="font-size: 0.7rem;">(既定)</span>'}
        </td>
      `;
      dictTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-del-dict').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cIdx = Number(e.target.getAttribute('data-custom-idx'));
        state.customDict.splice(cIdx, 1);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(state.customDict));
        renderDictTable();
        showToast('辞書エントリを削除しました');
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  if (btnAddDictEntry) {
    btnAddDictEntry.addEventListener('click', () => {
      const pattern = dictInputPattern ? dictInputPattern.value.trim() : '';
      const replacement = dictInputReplacement ? dictInputReplacement.value.trim() : '';
      if (!pattern || !replacement) {
        showToast('置換前と置換後を両方入力してください');
        return;
      }
      state.customDict.push({ pattern, replacement });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DICT, JSON.stringify(state.customDict));
      dictInputPattern.value = '';
      dictInputReplacement.value = '';
      renderDictTable();
      showToast('辞書に新しい置換語を追加しました');
    });
  }

  function executeAnonymize() {
    let currentText = writingCanvas ? writingCanvas.value : '';
    if (!currentText.trim()) {
      showToast('執筆エリアが空です');
      return;
    }

    saveUndoState();
    let replacedCount = 0;
    const dict = getMergedDict();

    dict.forEach(item => {
      const regex = new RegExp(item.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = currentText.match(regex);
      if (matches) replacedCount += matches.length;
      currentText = currentText.replace(regex, item.replacement);
    });

    writingCanvas.value = currentText;
    updateCharCounts();
    autoSaveInputs();

    if (replacedCount > 0) {
      showToast(`🛡️ ${replacedCount}箇所の固有名詞を匿名化置換しました！`);
    } else {
      showToast('検知された特定固有名詞はありませんでした');
    }
  }

  if (btnExecDictReplace) {
    btnExecDictReplace.addEventListener('click', () => {
      executeAnonymize();
      closeAllModals();
    });
  }

  if (btnAnonymizeDict) {
    btnAnonymizeDict.addEventListener('click', executeAnonymize);
  }

  // =========================================================================
  // 13. Backup & Restore (JSON一括書き出し・読み込み) (要件5)
  // =========================================================================
  if (btnExportBackupJson) {
    btnExportBackupJson.addEventListener('click', () => {
      const backupData = {
        app: 'Tamaki Studio-Lite',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        currentGenre: state.currentGenre,
        tuning: state.tuning,
        apiKey: state.apiKey,
        apiModel: state.apiModel,
        customDict: state.customDict,
        detoxHistory: state.detoxHistory,
        writingSnapshots: state.writingSnapshots,
        draftContent: draftOutput ? draftOutput.value : '',
        writingContent: writingCanvas ? writingCanvas.value : '',
        essay: {
          theme: essayTheme ? essayTheme.value : '',
          exp: essayExp ? essayExp.value : '',
          insight: essayInsight ? essayInsight.value : '',
          ending: essayEnding ? essayEnding.value : ''
        },
        subculture: {
          target: subcultureTarget ? subcultureTarget.value : '',
          doubts: subcultureDoubts ? subcultureDoubts.value : '',
          insight: subcultureInsight ? subcultureInsight.value : '',
          ending: subcultureEnding ? subcultureEnding.value : ''
        },
        novel: {
          setting: novelSetting ? novelSetting.value : '',
          flow: novelFlow ? novelFlow.value : '',
          sensory: novelSensory ? novelSensory.value : '',
          ending: novelEnding ? novelEnding.value : ''
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.href = url;
      a.download = `tamaki_lite_backup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 バックアップJSONを書き出しました');
    });
  }

  if (btnTriggerImportJson && backupFileInput) {
    btnTriggerImportJson.addEventListener('click', () => backupFileInput.click());
    backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.app !== 'Tamaki Studio-Lite' && !data.writingContent && !data.essay) {
            throw new Error('互換性のないバックアップファイルです');
          }

          if (data.currentGenre) setGenre(data.currentGenre, false);
          if (data.tuning) {
            state.tuning = Object.assign(state.tuning, data.tuning);
            applyTuningToUI();
          }
          if (data.apiKey) state.apiKey = data.apiKey;
          if (data.apiModel) state.apiModel = data.apiModel;
          if (Array.isArray(data.customDict)) state.customDict = data.customDict;
          if (Array.isArray(data.detoxHistory)) state.detoxHistory = data.detoxHistory;
          if (Array.isArray(data.writingSnapshots)) state.writingSnapshots = data.writingSnapshots;

          if (draftOutput && data.draftContent !== undefined) draftOutput.value = data.draftContent;
          if (writingCanvas && data.writingContent !== undefined) writingCanvas.value = data.writingContent;

          if (data.essay) {
            if (essayTheme) essayTheme.value = data.essay.theme || '';
            if (essayExp) essayExp.value = data.essay.exp || '';
            if (essayInsight) essayInsight.value = data.essay.insight || '';
            if (essayEnding) essayEnding.value = data.essay.ending || '';
          }
          if (data.subculture) {
            if (subcultureTarget) subcultureTarget.value = data.subculture.target || '';
            if (subcultureDoubts) subcultureDoubts.value = data.subculture.doubts || '';
            if (subcultureInsight) subcultureInsight.value = data.subculture.insight || '';
            if (subcultureEnding) subcultureEnding.value = data.subculture.ending || '';
          }
          if (data.novel) {
            if (novelSetting) novelSetting.value = data.novel.setting || '';
            if (novelFlow) novelFlow.value = data.novel.flow || '';
            if (novelSensory) novelSensory.value = data.novel.sensory || '';
            if (novelEnding) novelEnding.value = data.novel.ending || '';
          }

          autoSaveInputs();
          renderDictTable();
          renderDetoxDropdown();
          updateCharCounts();
          closeAllModals();
          showToast('📂 バックアップから完全復元しました！');
        } catch (err) {
          alert('復元に失敗しました: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // =========================================================================
  // 14. Standalone & Modal API Settings Engine (v4.1.1準拠)
  // =========================================================================
  function syncApiStateToUI() {
    const key = state.apiKey;
    const model = state.apiModel;

    if (apiKeyInput) apiKeyInput.value = key;
    if (quickApiKey) quickApiKey.value = key;
    if (apiModelSelect) apiModelSelect.value = model;
    if (quickApiModel) quickApiModel.value = model;

    if (apiStatusBadge) {
      if (key) {
        apiStatusBadge.textContent = `🟢 連携完了 (${model})`;
        apiStatusBadge.style.color = 'var(--accent-green)';
      } else {
        apiStatusBadge.textContent = '未設定（プロンプト生成モード）';
        apiStatusBadge.style.color = 'var(--text-subtle)';
      }
    }

    if (actionHintText) {
      if (key) {
        actionHintText.textContent = `⚡ Gemini直接AI生成モード (モデル: ${model})`;
        actionHintText.style.color = 'var(--accent-cyan)';
      } else {
        actionHintText.textContent = '※ Gemini API設定時は直接AI生成、未設定時はプロンプト生成＆自動コピー';
        actionHintText.style.color = 'var(--text-subtle)';
      }
    }
  }

  // Toggle standalone API card in left panel
  if (headerApiToggle) {
    headerApiToggle.addEventListener('click', () => {
      if (!apiCardContent) return;
      const isHidden = apiCardContent.classList.contains('hidden');
      apiCardContent.classList.toggle('hidden', !isHidden);
      if (btnToggleApiCard) {
        btnToggleApiCard.textContent = isHidden ? '閉じる ▴' : '開く ▾';
      }
    });
  }

  // Fetch Available Models from Google AI Studio
  async function fetchAvailableModels(key, statusEl) {
    if (!key) {
      alert('先にAPIキーを入力してください');
      return;
    }
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = '利用可能モデル一覧を取得中...';
      statusEl.style.color = 'var(--accent-cyan)';
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'モデルの取得に失敗しました');

      const textModels = (data.models || []).filter(m => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        !m.name.includes('tts') &&
        !m.name.includes('audio')
      );

      if (textModels.length === 0) throw new Error('使用可能なテキスト生成モデルが見つかりませんでした');

      [apiModelSelect, quickApiModel].forEach(sel => {
        if (!sel) return;
        sel.innerHTML = '';
        textModels.forEach(m => {
          const id = m.name.replace('models/', '');
          const opt = document.createElement('option');
          opt.value = id;
          opt.textContent = `${m.displayName || id} (${id})`;
          sel.appendChild(opt);
        });
      });

      const preferred = textModels.find(m => m.name.includes('gemini-2.5-flash')) ||
                        textModels.find(m => m.name.includes('gemini-1.5-flash-latest')) ||
                        textModels[0];
      const preferredId = preferred.name.replace('models/', '');
      state.apiModel = preferredId;
      if (apiModelSelect) apiModelSelect.value = preferredId;
      if (quickApiModel) quickApiModel.value = preferredId;
      localStorage.setItem(STORAGE_KEYS.API_MODEL, preferredId);

      if (statusEl) {
        statusEl.textContent = `✅ ${textModels.length}件の利用可能モデルを取得しました！`;
        statusEl.style.color = 'var(--accent-green)';
      }
      showToast(`🔍 ${textModels.length}件のモデル一覧を取得しました`);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = `❌ エラー: ${err.message}`;
        statusEl.style.color = 'var(--accent-danger)';
      }
      showToast(`モデル取得失敗: ${err.message}`);
    }
  }

  if (btnFetchModels) {
    btnFetchModels.addEventListener('click', () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : '';
      fetchAvailableModels(key, modelFetchStatus);
    });
  }

  if (btnQuickFetchModels) {
    btnQuickFetchModels.addEventListener('click', () => {
      const key = quickApiKey ? quickApiKey.value.trim() : '';
      fetchAvailableModels(key, quickModelStatus);
    });
  }

  // Save API Settings
  function saveApiSettings(key, model) {
    state.apiKey = key;
    state.apiModel = model;
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    localStorage.setItem(STORAGE_KEYS.API_MODEL, model);
    syncApiStateToUI();
    closeAllModals();
    showToast(key ? `⚙️ API連携を保存しました (${model})` : 'APIキーを未設定にしました');
  }

  // Remove API Key
  function removeApiKey() {
    state.apiKey = '';
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    syncApiStateToUI();
    closeAllModals();
    showToast('APIキーを削除しました（プロンプト生成モードに移行）');
  }

  // Modal Handlers
  if (btnSaveApiKey) {
    btnSaveApiKey.addEventListener('click', () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : '';
      const model = apiModelSelect ? apiModelSelect.value : 'gemini-2.5-flash';
      saveApiSettings(key, model);
    });
  }

  if (btnRemoveApiKey) {
    btnRemoveApiKey.addEventListener('click', removeApiKey);
  }

  // Standalone Card Handlers
  if (btnQuickSaveApi) {
    btnQuickSaveApi.addEventListener('click', () => {
      const key = quickApiKey ? quickApiKey.value.trim() : '';
      const model = quickApiModel ? quickApiModel.value : 'gemini-2.5-flash';
      saveApiSettings(key, model);
    });
  }

  if (btnQuickRemoveApi) {
    btnQuickRemoveApi.addEventListener('click', removeApiKey);
  }

  // =========================================================================
  // 15. History Modal & Snapshots
  // =========================================================================
  let currentHistTab = 'detox';

  if (tabHistDetox) {
    tabHistDetox.addEventListener('click', () => {
      currentHistTab = 'detox';
      tabHistDetox.classList.add('active');
      if (tabHistWriting) tabHistWriting.classList.remove('active');
      renderHistoryList();
    });
  }

  if (tabHistWriting) {
    tabHistWriting.addEventListener('click', () => {
      currentHistTab = 'writing';
      tabHistWriting.classList.add('active');
      if (tabHistDetox) tabHistDetox.classList.remove('active');
      renderHistoryList();
    });
  }

  if (btnSaveCurrentSnapshot) {
    btnSaveCurrentSnapshot.addEventListener('click', () => {
      const text = writingCanvas ? writingCanvas.value.trim() : '';
      if (!text) return showToast('執筆エリアが空です');
      const item = {
        id: Date.now(),
        date: new Date().toLocaleString('ja-JP'),
        charCount: text.length,
        genre: state.currentGenre,
        text
      };
      state.writingSnapshots.unshift(item);
      if (state.writingSnapshots.length > 20) state.writingSnapshots.pop();
      localStorage.setItem(STORAGE_KEYS.WRITING_SNAPSHOTS, JSON.stringify(state.writingSnapshots));
      renderHistoryList();
      showToast('💾 原稿のスナップショットを保存しました');
    });
  }

  if (btnClearAllHistory) {
    btnClearAllHistory.addEventListener('click', () => {
      if (confirm('すべての履歴（落書きおよびスナップショット）を消去しますか？')) {
        state.detoxHistory = [];
        state.writingSnapshots = [];
        localStorage.removeItem(STORAGE_KEYS.DETOX_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.WRITING_SNAPSHOTS);
        renderDetoxDropdown();
        renderHistoryList();
        showToast('履歴を全消去しました');
      }
    });
  }

  function renderHistoryList() {
    if (!historyListContent) return;
    historyListContent.innerHTML = '';

    if (currentHistTab === 'detox') {
      if (state.detoxHistory.length === 0) {
        historyListContent.innerHTML = '<p class="modal-desc" style="text-align: center; padding: 20px;">便所の落書き履歴はまだありません</p>';
        return;
      }
      state.detoxHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <div class="history-meta">
            <span>📅 ${item.date}</span>
            <span>${item.text.length} 文字</span>
          </div>
          <div class="history-snippet">${escapeHtml(item.text)}</div>
        `;
        div.addEventListener('click', () => {
          if (detoxInput) {
            detoxInput.value = item.text;
            updateCharCounts();
            closeAllModals();
            showToast('落書きを復元しました');
          }
        });
        historyListContent.appendChild(div);
      });
    } else {
      if (state.writingSnapshots.length === 0) {
        historyListContent.innerHTML = '<p class="modal-desc" style="text-align: center; padding: 20px;">原稿スナップショットはまだありません</p>';
        return;
      }
      state.writingSnapshots.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <div class="history-meta">
            <span>📅 ${item.date} [${item.genre || '原稿'}]</span>
            <span><strong>${item.charCount}</strong> 文字</span>
          </div>
          <div class="history-snippet">${escapeHtml(item.text)}</div>
        `;
        div.addEventListener('click', () => {
          if (confirm(`このスナップショット（${item.charCount}文字）を執筆エリアに復元しますか？`)) {
            saveUndoState();
            if (writingCanvas) writingCanvas.value = item.text;
            updateCharCounts();
            autoSaveInputs();
            closeAllModals();
            showToast('原稿スナップショットを復元しました！');
          }
        });
        historyListContent.appendChild(div);
      });
    }
  }

  // =========================================================================
  // 16. Modal Controller
  // =========================================================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
  }

  function closeAllModals() {
    [modalHistory, modalDict, modalApi, modalBackup].forEach(m => {
      if (m) m.classList.add('hidden');
    });
  }

  closeButtons.forEach(btn => btn.addEventListener('click', closeAllModals));

  [modalHistory, modalDict, modalApi, modalBackup].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
    }
  });

  if (btnOpenHistory) {
    btnOpenHistory.addEventListener('click', () => {
      renderHistoryList();
      openModal(modalHistory);
    });
  }

  if (btnOpenDict) {
    btnOpenDict.addEventListener('click', () => {
      renderDictTable();
      openModal(modalDict);
    });
  }

  if (btnOpenApi) {
    btnOpenApi.addEventListener('click', () => {
      syncApiStateToUI();
      openModal(modalApi);
    });
  }

  if (btnOpenBackup) {
    btnOpenBackup.addEventListener('click', () => openModal(modalBackup));
  }

  // Launch v4.1.1 Button (要件11)
  if (btnLaunchV4) {
    btnLaunchV4.addEventListener('click', (e) => {
      const text = writingCanvas ? writingCanvas.value.trim() : '';
      if (text) {
        navigator.clipboard.writeText(text);
        showToast('🚀 原稿をクリップボードにコピーしてフル機能版(v4.1.1)を開きます');
      }
    });
  }

  // =========================================================================
  // 17. Mobile Optimization (iPhone 14 Pro 393x852) & Quick Assist Bar
  // =========================================================================
  function switchMobileTab(targetTab) {
    state.mobileTab = targetTab;
    mobileNavTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-target-panel') === targetTab);
    });

    if (panelInput && panelEditor && blockDraft && blockWriting) {
      if (targetTab === 'input') {
        panelInput.classList.add('mobile-active');
        panelEditor.classList.remove('mobile-active');
      } else if (targetTab === 'draft') {
        panelInput.classList.remove('mobile-active');
        panelEditor.classList.add('mobile-active');
        blockDraft.classList.remove('mobile-hidden');
        blockDraft.classList.add('mobile-fullscreen');
        blockWriting.classList.add('mobile-hidden');
        blockWriting.classList.remove('mobile-fullscreen');
      } else if (targetTab === 'writing') {
        panelInput.classList.remove('mobile-active');
        panelEditor.classList.add('mobile-active');
        blockWriting.classList.remove('mobile-hidden');
        blockWriting.classList.add('mobile-fullscreen');
        blockDraft.classList.add('mobile-hidden');
        blockDraft.classList.remove('mobile-fullscreen');
      }
    }
  }

  mobileNavTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchMobileTab(tab.getAttribute('data-target-panel'));
    });
  });

  // Mobile Quick Assist Bar
  if (quickAssistBar) {
    quickAssistBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.assist-key');
      if (!btn || btn.classList.contains('assist-action')) return;

      const targetEl = state.mobileTab === 'draft' ? draftOutput : writingCanvas;
      if (!targetEl) return;

      const insertStr = btn.getAttribute('data-insert');
      const wrapStart = btn.getAttribute('data-wrap');
      const wrapEnd = btn.getAttribute('data-wrap-end');

      saveUndoState();
      const start = targetEl.selectionStart || 0;
      const end = targetEl.selectionEnd || 0;
      const currentVal = targetEl.value;

      if (wrapStart && wrapEnd) {
        const selected = currentVal.substring(start, end);
        targetEl.value = currentVal.substring(0, start) + wrapStart + selected + wrapEnd + currentVal.substring(end);
        targetEl.selectionStart = start + wrapStart.length;
        targetEl.selectionEnd = end + wrapStart.length;
      } else if (insertStr) {
        targetEl.value = currentVal.substring(0, start) + insertStr + currentVal.substring(end);
        targetEl.selectionStart = targetEl.selectionEnd = start + insertStr.length;
      }

      targetEl.focus();
      updateCharCounts();
      autoSaveInputs();
    });
  }

  if (btnAssistCopy) {
    btnAssistCopy.addEventListener('click', () => {
      const targetEl = state.mobileTab === 'draft' ? draftOutput : writingCanvas;
      if (!targetEl || !targetEl.value.trim()) return showToast('コピーする内容がありません');
      navigator.clipboard.writeText(targetEl.value).then(() => showToast('📋 コピーしました'));
    });
  }

  if (btnAssistUndo) {
    btnAssistUndo.addEventListener('click', () => {
      if (state.undoStack.length > 0 && writingCanvas) {
        writingCanvas.value = state.undoStack.pop();
        updateCharCounts();
        autoSaveInputs();
        showToast('↩ 直前の状態に戻しました');
      } else {
        showToast('これ以上戻せません');
      }
    });
  }

  // =========================================================================
  // 18. Service Worker Registration & Initialization
  // =========================================================================
  function init() {
    loadStoredData();
    setupSliderListeners();

    // Responsive initial check
    if (window.innerWidth <= 768) {
      switchMobileTab('input');
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration skipped:', err);
      });
    }
  }

  window.addEventListener('DOMContentLoaded', init);

})();
