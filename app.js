/**
 * Tamaki Studio v2.0 Pro - Application Logic
 * たまきぱずず専属 文書執筆・原稿解析・プロンプト生成工房
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. State Management
  // ==========================================
  let initialModel = localStorage.getItem('tamaki_gemini_model');
  if (!initialModel || initialModel.includes('tts') || initialModel.includes('2.5-flash') || initialModel.includes('audio')) {
    initialModel = 'gemini-1.5-flash-latest';
    localStorage.setItem('tamaki_gemini_model', initialModel);
  }

  const state = {
    currentMode: 'essay', // 'essay' | 'subculture' | 'novel'
    activeTab: 'preview', // 'preview' | 'prompt'
    apiKey: localStorage.getItem('tamaki_gemini_api_key') || '',
    apiModel: initialModel,
    history: JSON.parse(localStorage.getItem('tamaki_history') || '[]'),
    lastGeneratedPrompt: '',
    loadedDoc: null, // { name: '', content: '', chars: 0 }
    tuning: {
      meta: 3,   // 1: 控えめ, 2: 標準, 3: 全開 (筆者特有)
      detail: 3, // 1: 標準, 2: 高解像度, 3: 超高解像度 (生々しさ)
      tempo: 1,  // 1: スマホ短文, 2: 標準, 3: 重厚
      antiAi: true
    }
  };

  // ==========================================
  // 2. Few-Shot / Corpus Presets & Phrase Dictionaries
  // ==========================================
  const phraseDictionary = {
    common: [
      "……お気づきでしょうか。",
      "完全に掌の上で転がされている",
      "安心感を買っているだけ",
      "老害オタクの夜戯言",
      "寒イボが出る",
      "ま、楽しければいいんじゃね？"
    ],
    essay: [
      "安心感を買っているだけに過ぎない",
      "茶店の冷たい麦茶が最強",
      "ポチる指が止まらない",
      "道具への依存と格好つけが招いた惨敗",
      "オチのない散財ループはまだ続く",
      "格好つけて最新ギア買ったのにこのザマ",
      "結局、道具じゃねえ"
    ],
    subculture: [
      "自称・オールドタイプ宇宙世紀原理主義者",
      "トミノメモの精査",
      "看板（IP）を背負わせただけの違和感",
      "泥とオイルの匂いがするリアリズム",
      "現場の一兵卒視点のスピンオフ",
      "富野御大の掌の上で転がされている",
      "積みプラのザクのバリでも削ることにします",
      "若きニュータイプに冷笑される前に"
    ],
    colony_sf: [
      "メガ・イマジニアリング（Giga-scale Imagineering）",
      "ISRU（現地資源利用）による土壌生成",
      "対面の地面が見えるという構造的制約",
      "生態系のパッケージ販売",
      "生活感とインフラのリアリズム",
      "国家予算級の物理投資"
    ],
    novel: [
      "冷徹に観察するメタ認知",
      "雨の夜のオフィスと微かな香水の匂い",
      "理性が崩れていくグラデーション",
      "生々しい吐息とストッキングの擦れる音",
      "戻らなければならない現実への帰還",
      "車内の密室と静寂"
    ]
  };

  // Full Rich Presets (Based on actual original manuscripts)
  const presets = {
    essay_golf: {
      mode: 'essay',
      theme: "真夏の酷暑ゴルフと、最新冷却ギアへの散財（そして結局効いたもの）",
      experience: `・最高気温37度の炎天下、前半4ホール目で早くも頭痛と意識朦朧。
・気合を入れて買った「ペルチェ素子冷却ベスト（2万8千円）」と「超強力ハンディファン」をフル稼働。
・だがベストは30分でバッテリー切れ、ファンは熱風を吹き付けるだけのドライヤーと化す。
・同伴者に「それ、ただの重りじゃん」と笑われ、結局一番生き返ったのは茶店のおばちゃんがくれた無料の麦茶と冷たいおしぼりだった。
・道具への依存と格好つけが招いた惨敗。`,
      insight: `テクノロジーで自然の猛威をねじ伏せようとする現代人の傲慢と見栄。散財して最新ギアを買い漁る行為は、暑さ対策というより「万全な自分」という安心感を買っているだけに過ぎない。自然の前では、無理せず撤退する勇気と冷たい麦茶が最強。`,
      ending: `懲りずに来週のラウンドに向けて、Amazonで「最強ネッククーラー」をポチっている自分がいる。オチのない散財ループはまだ続く。`
    },
    essay_gadget: {
      mode: 'essay',
      theme: "作業効率化という免罪符で買い漁るデスク周辺機器と、減らない未完了タスク",
      experience: `・「これで生産性が2倍になる」と信じて購入したエルゴノミクスキーボード（4万5千円）と4K曲面ウルトラワイドモニター。
・配線整理に丸一日費やし、デスクはまるでNASAの管制室。
・だが実際に始めた作業は、モニターのカラーキャリブレーションと新しい壁紙探し。
・キー配列の違いに指が攣りそうになり、結局使い慣れたMacBookのペタペタキーボードに戻る始末。`,
      insight: `「道具を揃えれば自分が有能になる」という錯覚。散財は自己投資という名の現実逃避であり、ツールを愛でている時間は最もタスクが進んでいない時間であるという皮肉な真実。`,
      ending: `「いや、トラックボールマウスさえ導入すれば完璧なはずだ」とメルカリを物色し始める愚行。作業が終わるのはいつの日か。`
    },
    subculture_gundam52: {
      mode: 'subculture',
      target: "機動戦士ガンダム 全52話打ち切りIF / トミノメモと宇宙世紀の生存",
      doubts: `・「もしファーストガンダムが全52話完走していたら今日のガンダムブームは存在しなかった」という逆説。
・打ち切り決定によって全43話に凝縮されたからこそ、作品純度が極限まで高まり、ガンプラ（300円）の爆発的熱狂に繋がった。
・トミノメモの構想通りなら、シャアはア・バオア・クーで戦死していた。シャア不在ならZのクワトロも逆シャアもハサウェイも消滅していたという寒イボの立つ事実。`,
      insight: `・アニメ制作者最大の敗北である「打ち切り」を、富野由悠季という巨匠は極上の劇薬（ファンの飢餓感・神話化）へと変えてみせた。
・シャアとアムロの超人劇が早期終結した世界線では、むしろコミックボンボンやMSV、横山宏氏や小林誠氏のような「泥とオイルの匂いがする現場一兵卒のミリタリーSF」が爆発していた可能性。
・商業構造と作家性の奇跡的な化学反応の考察。`,
      ending: `……いやあ、完全に富野御大の掌の上で転がされているだけじゃないですか、私。「これだからオールドタイプは……」と若きニュータイプに冷笑される前に、今夜は大人しく積みプラのザクのバリでも削ることにします。単なるオールドタイプの夜戯言とお笑いくだされば幸いです。`
    },
    subculture_colony: {
      mode: 'subculture',
      target: "宇宙世紀スペースコロニーの日常考証：テキサスコロニー建造計画とメガ・イマジニアリング",
      doubts: `・サイド5ルウムが潤沢な資金で作った屋内サファリ・テーマパーク「テキサスコロニー」。
・西暦だろうが宇宙世紀だろうが、人が余暇を求めるのは自然なことだが、宇宙で「開拓時代の北アメリカ」を再現する無謀さとコスト。
・「空を見上げると対面の地面が見える」というコロニー構造特有の制約をどうやって克服し、広大な地平線の錯覚を作ったのか？`,
      insight: `・国家予算級のインフラ整備と民間ホスピタリティの融合「メガ・イマジニアリング（Giga-scale Imagineering）」。
・予算比率試算：初期土壌造成(ISRU)35%、気候・大気制御35%、生態系バイオーム管理15%、ゲスト体験15%。
・ウォルト・ディズニー・ワールド（約3.5〜5兆円）の約5倍の広さを宇宙で維持する「生態系のパッケージ販売とフロンティア精神の商用化」。`,
      ending: `ルウム戦役でミラー制御が壊れ、あっけなく廃墟と化したテキサスコロニー。どれほど天文学的な予算と科学の粋を集めても、戦争の一撃で砂漠と化すのが宇宙世紀のリアリズム。今夜は自宅のエアコンの除湿ボタンをありがたく押すことにします。`
    },
    subculture_requiem: {
      mode: 'subculture',
      target: "機動戦士ガンダム 復讐のレクイエム / 近年の宇宙世紀スピンオフ作品群",
      doubts: `・Unreal Engineの美麗な海外向けフルCGは評価するが、「本当にガンダムである必然性」があるのか？
・ミリタリーアクションとしては上質だが、富野作品特有の「言葉のトゲ」「噛み合わないエゴのぶつかり合い」が綺麗に脱臭されている違和感。
・ガンダムという看板（IP）を背負わせただけの良質SFになっていないか？`,
      insight: `・バンダイナムコの世界展開戦略と欧米市場向けビジネスの要請。
・宇宙世紀のリアリズムとは単に「装甲の汚れや傷」ではなく、「持たざる者たちの生活感、コロニーの空気感、理不尽な組織構造」。
・1st〜逆シャア〜閃光のハサウェイに至る宇宙世紀原理主義者の視点から、何が継承され、何が抜け落ちているのかの構造比較。`,
      ending: `文句を言いつつも、配信開始日に正座して一気見してしまうのがオールドタイプの悲しい業（ごう）。ま、楽しければいいんじゃね？`
    },
    novel_office: {
      mode: 'novel',
      characters: `主人公（男）：42歳。中堅広告代理店の企画部長。妻子持ち。冷めたメタ認知で自分と相手を観察しながらも、情欲に抗えない。
相手（女性）：31歳。同部署のチーフ。仕事は完璧だが、二人きりになると脆く、甘えたような視線を送る。`,
      setting: `大型台風が直撃した夜のオフィス。全社員が退社した後の薄暗い応接室。窓を叩く激しい雨音と、エアコンの微かな送風音。濡れた服と微かな香水の匂い。`,
      focus: `・最初は「部長、ダメです」と拒否していた手が、服を解くにつれて強く背中に回るまでのグラデーション。
・行為の最中も、主人公の脳裏に「明日の企画会議のスケジュール」や「自分のみっともない独占欲」が冷徹に去来する二重構造（メタ認知）。
・生々しい吐息、ストッキングが擦れる音、肌の熱と冷たさの対比。`,
      ending: `行為の後の静寂。遠くのサイレンの音。ネクタイを結び直しながら見つめる、散らかったソファと戻らなければならない日常への帰還。`
    },
    novel_drive: {
      mode: 'novel',
      characters: `主人公（男）：45歳。既婚。理性でブレーキをかけようとしつつ、相手の沈黙と視線に抗えない。
相手（女性）：30代後半。普段は職場の同僚。家庭に満たされない影を抱え、助手席で目を伏せる。`,
      setting: `雨上がりの夜、郊外の暗い駐車場。マークIIプレミオの車内。曇ったフロントガラスと、アイドリングの微かな振動。缶コーヒーの微温さ。`,
      focus: `・車中では他愛もない世間話。だが沈黙が訪れた瞬間に縮まる距離。
・肩を抱き寄せた時の躊躇と、唇が重なった瞬間の吐息。
・「ダメです」と呟きながらも、指先が服を掴んで離さない生々しい心理の機微。`,
      ending: `車内を満たす静寂とタバコの煙。ルームミラー越しにネクタイを整え、何事もなかったかのように夜の幹線道路へと合流していく日常の残酷さ。`
    }
  };

  // ==========================================
  // 3. DOM Elements
  // ==========================================
  // Drop Zone
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const loadedDocBar = document.getElementById('loaded-doc-bar');
  const dropZoneInner = document.getElementById('drop-zone-inner');
  const loadedDocName = document.getElementById('loaded-doc-name');
  const loadedDocChars = document.getElementById('loaded-doc-chars');
  const btnApplyDocForm = document.getElementById('btn-apply-doc-form');
  const btnClearDoc = document.getElementById('btn-clear-doc');

  // Tabs & Presets
  const modeTabs = document.querySelectorAll('.mode-tab');
  const formTitle = document.getElementById('form-title');
  const presetSelector = document.getElementById('preset-selector');
  const paletteChipsContainer = document.getElementById('palette-chips');

  // Fields Containers
  const fieldsEssay = document.getElementById('fields-essay');
  const fieldsSubculture = document.getElementById('fields-subculture');
  const fieldsNovel = document.getElementById('fields-novel');

  // Sliders
  const sliderMeta = document.getElementById('slider-meta');
  const sliderDetail = document.getElementById('slider-detail');
  const sliderTempo = document.getElementById('slider-tempo');
  const valMeta = document.getElementById('val-meta');
  const valDetail = document.getElementById('val-detail');
  const valTempo = document.getElementById('val-tempo');
  const toggleAntiAi = document.getElementById('toggle-anti-ai');
  const btnResetTuning = document.getElementById('btn-reset-tuning');

  // Action Buttons
  const btnBuildPrompt = document.getElementById('btn-build-prompt');
  const btnAiGenerate = document.getElementById('btn-ai-generate');

  // Output & Editor
  const tabPreview = document.getElementById('tab-preview');
  const tabPromptView = document.getElementById('tab-prompt-view');
  const outputEditor = document.getElementById('output-editor');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const charCount = document.getElementById('char-count');
  const readTime = document.getElementById('read-time');
  const btnCopyOutput = document.getElementById('btn-copy-output');
  const btnDownloadMd = document.getElementById('btn-download-md');
  const toastMessage = document.getElementById('toast-message');

  // Synchro-Meter & AI Smell
  const synchroScoreVal = document.getElementById('synchro-score-val');
  const synchroBadge = document.getElementById('synchro-badge');
  const synchroBarFill = document.getElementById('synchro-bar-fill');
  const metricMetaVal = document.getElementById('metric-meta-val');
  const metricMetaFill = document.getElementById('metric-meta-fill');
  const metricDetailVal = document.getElementById('metric-detail-val');
  const metricDetailFill = document.getElementById('metric-detail-fill');
  const metricTempoVal = document.getElementById('metric-tempo-val');
  const metricTempoFill = document.getElementById('metric-tempo-fill');
  const metricEndingVal = document.getElementById('metric-ending-val');
  const metricEndingFill = document.getElementById('metric-ending-fill');
  const synchroAdvice = document.getElementById('synchro-advice');

  const aiSmellAlert = document.getElementById('ai-smell-alert');
  const aiSmellDetails = document.getElementById('ai-smell-details');
  const btnFixSmell = document.getElementById('btn-fix-smell');
  const rewriteChips = document.querySelectorAll('.rewrite-chip');

  // Modals
  const btnGuide = document.getElementById('btn-guide');
  const modalGuide = document.getElementById('modal-guide');
  const btnCloseGuideModal = document.getElementById('btn-close-guide-modal');
  const btnCloseGuideFooter = document.getElementById('btn-close-guide-footer');

  const btnApiSettings = document.getElementById('btn-api-settings');
  const modalApiSettings = document.getElementById('modal-api-settings');
  const btnCloseApiModal = document.getElementById('btn-close-api-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiModelSelect = document.getElementById('api-model-select');
  const btnFetchModels = document.getElementById('btn-fetch-models');
  const modelFetchStatus = document.getElementById('model-fetch-status');
  const btnSaveApi = document.getElementById('btn-save-api');

  const btnHistory = document.getElementById('btn-history');
  const modalHistory = document.getElementById('modal-history');
  const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
  const historyList = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Track active input for phrase insertion
  let lastActiveInput = null;
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('focus', () => {
      if (el.id !== 'output-editor') {
        lastActiveInput = el;
      }
    });
  });

  // ==========================================
  // 4. UI Interactions & Mode Switch
  // ==========================================

  function renderPalette() {
    paletteChipsContainer.innerHTML = '';
    const mode = state.currentMode;
    let chips = [...phraseDictionary.common];

    if (mode === 'essay') {
      chips = [...phraseDictionary.essay, ...phraseDictionary.common];
    } else if (mode === 'subculture') {
      chips = [...phraseDictionary.subculture, ...phraseDictionary.colony_sf, ...phraseDictionary.common];
    } else if (mode === 'novel') {
      chips = [...phraseDictionary.novel, ...phraseDictionary.common];
    }

    // Deduplicate
    const uniqueChips = Array.from(new Set(chips));

    uniqueChips.forEach(phrase => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-chip';
      btn.textContent = phrase;
      btn.title = 'クリックして現在の入力欄に挿入';
      btn.addEventListener('click', () => {
        insertPhraseToForm(phrase);
      });
      paletteChipsContainer.appendChild(btn);
    });
  }

  function insertPhraseToForm(phrase) {
    let target = lastActiveInput;
    if (!target || !document.body.contains(target) || target.closest('.mode-fields.hidden')) {
      // Default to appropriate field in current mode
      if (state.currentMode === 'essay') {
        target = document.getElementById('essay-experience');
      } else if (state.currentMode === 'subculture') {
        target = document.getElementById('subculture-doubts');
      } else if (state.currentMode === 'novel') {
        target = document.getElementById('novel-focus');
      }
    }

    if (target) {
      target.focus();
      const start = target.selectionStart || target.value.length;
      const end = target.selectionEnd || target.value.length;
      const text = target.value;
      const prefix = (start > 0 && text[start - 1] !== '\n' && text[start - 1] !== ' ') ? ' ' : '';
      target.value = text.substring(0, start) + prefix + phrase + text.substring(end);
      target.selectionStart = target.selectionEnd = start + prefix.length + phrase.length;
      showToast(`「${phrase.substring(0, 12)}...」を挿入しました`);
    }
  }

  function setMode(mode) {
    state.currentMode = mode;
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    fieldsEssay.classList.toggle('hidden', mode !== 'essay');
    fieldsSubculture.classList.toggle('hidden', mode !== 'subculture');
    fieldsNovel.classList.toggle('hidden', mode !== 'novel');

    if (mode === 'essay') {
      formTitle.textContent = '☕ エッセイ執筆設定';
    } else if (mode === 'subculture') {
      formTitle.textContent = '🤖 ガンダム・サブカル論考執筆設定';
    } else if (mode === 'novel') {
      formTitle.textContent = '📖 小説・官能描写執筆設定';
    }

    renderPalette();
  }

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode);
    });
  });

  // Preset Selector
  presetSelector.addEventListener('change', (e) => {
    const key = e.target.value;
    if (presets[key]) {
      loadPreset(presets[key]);
      showToast('プリセット原稿を読み込みました！');
    }
  });

  function loadPreset(preset) {
    setMode(preset.mode);
    if (preset.mode === 'essay') {
      document.getElementById('essay-theme').value = preset.theme || '';
      document.getElementById('essay-experience').value = preset.experience || '';
      document.getElementById('essay-insight').value = preset.insight || '';
      document.getElementById('essay-ending').value = preset.ending || '';
    } else if (preset.mode === 'subculture') {
      document.getElementById('subculture-target').value = preset.target || '';
      document.getElementById('subculture-doubts').value = preset.doubts || '';
      document.getElementById('subculture-insight').value = preset.insight || '';
      document.getElementById('subculture-ending').value = preset.ending || '';
    } else if (preset.mode === 'novel') {
      document.getElementById('novel-characters').value = preset.characters || '';
      document.getElementById('novel-setting').value = preset.setting || '';
      document.getElementById('novel-focus').value = preset.focus || '';
      document.getElementById('novel-ending').value = preset.ending || '';
    }
  }

  // ==========================================
  // 5. Document Drop & File Reading (v2.0 New Feature)
  // ==========================================
  dropZone.addEventListener('click', (e) => {
    if (e.target.id !== 'btn-apply-doc-form' && e.target.id !== 'btn-clear-doc') {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      state.loadedDoc = {
        name: file.name,
        content: content,
        chars: content.length
      };

      // Update UI
      loadedDocName.textContent = file.name;
      loadedDocChars.textContent = `(${content.length.toLocaleString()}文字)`;
      dropZoneInner.classList.add('hidden');
      loadedDocBar.classList.remove('hidden');

      // Auto analyze and show toast
      showToast(`原稿「${file.name}」を文体リファレンスとして読み込みました！`);
    };
    reader.readAsText(file);
  }

  btnClearDoc.addEventListener('click', (e) => {
    e.stopPropagation();
    state.loadedDoc = null;
    fileInput.value = '';
    dropZoneInner.classList.remove('hidden');
    loadedDocBar.classList.add('hidden');
    showToast('原稿の読み込みを解除しました');
  });

  btnApplyDocForm.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!state.loadedDoc) return;
    parseAndApplyDocument(state.loadedDoc);
  });

  function parseAndApplyDocument(doc) {
    const lines = doc.content.split('\n');
    let title = '';
    let headings = [];
    let paragraphs = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('# ') && !title) {
        title = trimmed.replace('# ', '').trim();
      } else if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        headings.push(trimmed.replace(/^#+\s*/, '').trim());
      } else if (!trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('|')) {
        paragraphs.push(trimmed);
      }
    });

    if (!title && lines.length > 0) {
      title = lines[0].replace(/^[#\s"『「]+|[#\s"』」]+$/g, '').substring(0, 40);
    }

    // Determine best mode based on keywords
    const lowerContent = doc.content.toLowerCase();
    if (lowerContent.includes('ガンダム') || lowerContent.includes('コロニー') || lowerContent.includes('宇宙世紀') || lowerContent.includes('シャア') || lowerContent.includes('トミノ')) {
      setMode('subculture');
      document.getElementById('subculture-target').value = title || doc.name.replace(/\.md|\.txt/, '');
      document.getElementById('subculture-doubts').value = paragraphs.slice(0, 3).join('\n') || '・原稿からの抽出事項';
      document.getElementById('subculture-insight').value = (headings.length ? '論点：' + headings.join(' / ') + '\n' : '') + paragraphs.slice(3, 7).join('\n');
      if (paragraphs.length > 7) {
        document.getElementById('subculture-ending').value = paragraphs[paragraphs.length - 1].substring(0, 100);
      }
    } else if (lowerContent.includes('キス') || lowerContent.includes('車内') || lowerContent.includes('抱擁') || lowerContent.includes('乳房') || lowerContent.includes('オフィス') || lowerContent.includes('女性')) {
      setMode('novel');
      document.getElementById('novel-characters').value = title ? `登場人物：${title}` : '主人公、相手の女性';
      document.getElementById('novel-setting').value = paragraphs[0] ? paragraphs[0].substring(0, 80) : '雨の夜の密室';
      document.getElementById('novel-focus').value = paragraphs.slice(1, 6).join('\n');
      if (paragraphs.length > 6) {
        document.getElementById('novel-ending').value = paragraphs[paragraphs.length - 1].substring(0, 100);
      }
    } else {
      setMode('essay');
      document.getElementById('essay-theme').value = title || doc.name.replace(/\.md|\.txt/, '');
      document.getElementById('essay-experience').value = paragraphs.slice(0, 4).join('\n');
      document.getElementById('essay-insight').value = paragraphs.slice(4, 8).join('\n');
      if (paragraphs.length > 8) {
        document.getElementById('essay-ending').value = paragraphs[paragraphs.length - 1].substring(0, 100);
      }
    }

    showToast('原稿から各入力欄へ要点を自動展開しました！');
  }

  // ==========================================
  // 6. Slider Updates & Tuning
  // ==========================================
  const metaLabels = { 1: '控えめ', 2: '標準', 3: '全開 (自虐・迷い多め)' };
  const detailLabels = { 1: '標準', 2: '高解像度', 3: '超高解像度 (生々しい具体性)' };
  const tempoLabels = { 1: 'スマホ向け (改行・余白多め)', 2: '標準', 3: '重厚 (じっくり読ませる)' };

  sliderMeta.addEventListener('input', (e) => {
    state.tuning.meta = parseInt(e.target.value, 10);
    valMeta.textContent = metaLabels[state.tuning.meta];
  });

  sliderDetail.addEventListener('input', (e) => {
    state.tuning.detail = parseInt(e.target.value, 10);
    valDetail.textContent = detailLabels[state.tuning.detail];
  });

  sliderTempo.addEventListener('input', (e) => {
    state.tuning.tempo = parseInt(e.target.value, 10);
    valTempo.textContent = tempoLabels[state.tuning.tempo];
  });

  toggleAntiAi.addEventListener('change', (e) => {
    state.tuning.antiAi = e.target.checked;
  });

  btnResetTuning.addEventListener('click', () => {
    sliderMeta.value = 3;
    sliderDetail.value = 3;
    sliderTempo.value = 1;
    toggleAntiAi.checked = true;
    state.tuning = { meta: 3, detail: 3, tempo: 1, antiAi: true };
    valMeta.textContent = metaLabels[3];
    valDetail.textContent = detailLabels[3];
    valTempo.textContent = tempoLabels[1];
    showToast('チューニングをリセットしました');
  });

  // ==========================================
  // 7. Prompt Builder Engine (Few-Shot Injection)
  // ==========================================
  function buildPrompt() {
    const mode = state.currentMode;
    const tuning = state.tuning;

    let metaInstruction = "";
    if (tuning.meta === 3) {
      metaInstruction = "【最重要：メタ認知・自虐】鋭いメタ認知（自己客観視）と自虐・セルフツッコミを前面に出し、格好つけや迷いをユーモラスに自己開示すること。「……お気づきでしょうか」「完全に富野御大の掌の上」「安心感を買っているだけ」などの皮肉な自省を入れる。";
    } else if (tuning.meta === 2) {
      metaInstruction = "適度に自分を客観視し、冷静な大人の視座を保つこと。";
    } else {
      metaInstruction = "自己開示は控えめに、客観的な事象を軸に記述すること。";
    }

    let detailInstruction = "";
    if (tuning.detail === 3) {
      detailInstruction = "【超高解像度】抽象表現は厳禁。具体的な固有名詞、温度、触覚、匂い、金額（円）、生々しい試行錯誤の経過、機体名・車種・道具名を高い解像度で描写すること。";
    } else {
      detailInstruction = "具体的なエピソードや状況を分かりやすく描写すること。";
    }

    let tempoInstruction = "";
    if (tuning.tempo === 1) {
      tempoInstruction = "【リズム】スマホ読者がテンポよく読めるよう、1〜2文ごとに空行を挟み、適度な余白と口語・倒置・ト書きを織り交ぜること。";
    } else if (tuning.tempo === 3) {
      tempoInstruction = "【リズム】重厚でじっくり読ませる長文スタイル。論理展開と情景描写の厚みを重視すること。";
    } else {
      tempoInstruction = "【リズム】標準的なエッセイ・記事の改行ペースで構成すること。";
    }

    const antiAiInstruction = tuning.antiAi ? `
## 厳格な禁止事項（AI臭さの完全排除）
- ❌ 「いかがでしたでしょうか？」「〜してみてはいかがでしょうか」「素晴らしい未来が待っています」「ぜひ試してみてください」「まとめると」などのテンプレ的まとめ表現は厳禁。
- ❌ 紋切り型の教訓や、教科書的な綺麗事の結論で無理やり美談に仕立てない。
- ❌ 思考のプロセス（迷いや試行錯誤の途中経過）を端折らない。
` : "";

    // Specific mode input & Few-shot samples
    let modeSection = "";
    let fewShotSample = "";

    if (mode === 'essay') {
      const theme = document.getElementById('essay-theme').value.trim() || '日常の散財と試行錯誤';
      const experience = document.getElementById('essay-experience').value.trim() || '（実体験メモ）';
      const insight = document.getElementById('essay-insight').value.trim();
      const ending = document.getElementById('essay-ending').value.trim();

      fewShotSample = `
### 【筆者の文体お手本（Few-Shot Example）】
「最高気温37度の炎天下、前半4ホール目で早くも頭痛と意識朦朧。
気合を入れて買った2万8千円のペルチェ素子冷却ベストとハンディファンをフル稼働させるも、ベストは30分で沈黙し、ファンは熱風を吹き付けるだけのドライヤーと化した。
同伴者に『それ、ただの重りじゃん』と笑われ、結局一番生き返ったのは茶店のおばちゃんがくれた無料の麦茶と冷たいおしぼり。
道具で自然をねじ伏せようとする現代人の傲慢と見栄。散財は『万全な自分』という安心感を買っているだけに過ぎない。
……懲りずに来週のラウンドに向けて、Amazonで『最強ネッククーラー』をポチっている自分がいる。オチのない散財ループはまだ続く。」
`;

      modeSection = `
## 執筆ジャンル: エッセイ・コラム（散財・日常・メタ認知）
- **テーマ・導入のツカミ**: ${theme}
- **実体験・ディテール**: 
${experience}
${insight ? `- **深掘り・考察**: ${insight}` : ''}
${ending ? `- **結び・オチ**: ${ending}` : ''}
`;
    } else if (mode === 'subculture') {
      const target = document.getElementById('subculture-target').value.trim() || 'ガンダム / サブカル論考';
      const doubts = document.getElementById('subculture-doubts').value.trim() || '（率直な違和感・思考実験）';
      const insight = document.getElementById('subculture-insight').value.trim();
      const ending = document.getElementById('subculture-ending').value.trim();

      fewShotSample = `
### 【筆者の文体お手本（Few-Shot Example）】
「『ファーストガンダムが全52話完走していたら、今日のガンダムブームは存在しなかった』
……唐突に何を言い出すんだとお思いでしょう。自称・オールドタイプ宇宙世紀原理主義者のたまきぱずずです。
ネット等でも有名な『トミノメモ』を精査すると、ゾッとする事実に行き当たります。シャア・アズナブルはア・バオア・クーで戦死する予定だった。
シャアがいない世界線において、『Zガンダム』のクワトロ・バジーナは存在しません。クワトロがいなければエゥーゴのダカール演説もなく、『逆襲のシャア』も『閃光のハサウェイ』すら消滅するということです。
打ち切りという最大の敗北を、富野由悠季という巨匠は極上の劇薬へと変えてみせた。
……いやあ、完全に富野御大の掌の上で転がされているだけじゃないですか、私。『これだからオールドタイプは……』と若きニュータイプに冷笑される前に、今夜は大人しく積みプラのザクのバリでも削ることにします。」
`;

      modeSection = `
## 執筆ジャンル: ガンダム・サブカル論考（宇宙世紀原理主義・SF考証）
- **対象作品・トピック**: ${target}
- **感じた違和感・思考実験**: 
${doubts}
${insight ? `- **深掘り・考察（商業分析・SF技術的検証）**: ${insight}` : ''}
${ending ? `- **結びのトーン**: ${ending}` : ''}
`;
    } else if (mode === 'novel') {
      const characters = document.getElementById('novel-characters').value.trim() || '主人公と相手';
      const setting = document.getElementById('novel-setting').value.trim() || '雨の夜の密室';
      const focus = document.getElementById('novel-focus').value.trim() || '（心理の機微と情欲）';
      const ending = document.getElementById('novel-ending').value.trim();

      fewShotSample = `
### 【筆者の文体お手本（Few-Shot Example）】
「車内を満たす静寂と、エアコンの微かな送風音。
助手席で目を伏せる彼女の横顔を、どこか冷徹に観察している自分がいる。
最初は『ダメです』と小さく抵抗していた手が、肩を抱き寄せ唇を重ねるにつれて、ゆっくりと背中に回っていくまでの生々しいグラデーション。
『明日の朝には何食わぬ顔で出社しなければならない』という罪悪感と冷徹なメタ認知を抱えながらも、肌の熱と微かな香水の匂いに理性が押し流されていく。
行為の後の静寂。遠くのサイレンの音。ルームミラー越しにネクタイを結び直しながら、戻らなければならない日常の残酷さに息を吐く。」
`;

      modeSection = `
## 執筆ジャンル: 小説・官能描写（五感解像度・冷徹なメタ認知・大人の機微）
- **登場人物**: 
${characters}
- **舞台・環境**: ${setting}
- **ハイライト・心理焦点**: 
${focus}
${ending ? `- **結び・余韻**: ${ending}` : ''}
`;
    }

    // Reference Document Injection (if loaded)
    let refDocSection = "";
    if (state.loadedDoc && state.loadedDoc.content) {
      const truncated = state.loadedDoc.content.substring(0, 1500);
      refDocSection = `
## 【最重要参照：ユーザー提供の実原稿（この文体・リズム・語彙を直接踏襲すること）】
（ファイル名: ${state.loadedDoc.name}）
\`\`\`markdown
${truncated}
\`\`\`
※上記の原稿に見られる「一人称の語り口」「読者へのツッコミ」「生々しいリアリズム」「オチのつけ方」を深く模倣して執筆してください。
`;
    }

    return `# 命令書: 「たまきぱずず」スタイルによる文書執筆

あなたは、鋭いメタ認知、高い解像度、宇宙世紀原理主義、生々しいリアリズム、そして軽妙なオチを兼ね備えた人気Webライター／論客「たまきぱずず」です。
以下の前提・ルール・お手本を厳格に順守し、読者を惹きつける完成原稿を執筆してください。

${fewShotSample}
${refDocSection}
${modeSection}

## 文体・チューニング指示
- ${metaInstruction}
- ${detailInstruction}
- ${tempoInstruction}
${antiAiInstruction}

## 出力フォーマット
- タイトルから始め、noteやブログにそのまま投稿できるMarkdown形式で執筆してください。
- 前置き（「承知しました」「以下に執筆します」等）や後書き（「いかがでしょうか」等）は一切出力せず、本文のみを出力してください。
`;
  }

  // ==========================================
  // 8. Real-time Synchro-Meter & AI Smell Checker (v2.0 New Feature)
  // ==========================================
  function analyzeText(text) {
    if (!text || text.trim().length === 0) {
      synchroScoreVal.textContent = '0%';
      synchroBadge.textContent = '執筆待機中';
      synchroBadge.className = 'synchro-badge';
      synchroBarFill.style.width = '0%';
      metricMetaVal.textContent = '-';
      metricMetaFill.style.width = '0%';
      metricDetailVal.textContent = '-';
      metricDetailFill.style.width = '0%';
      metricTempoVal.textContent = '-';
      metricTempoFill.style.width = '0%';
      metricEndingVal.textContent = '-';
      metricEndingFill.style.width = '0%';
      synchroAdvice.textContent = '💡 原稿を入力またはAI生成すると、文体の本人度をリアルタイム診断します。';
      aiSmellAlert.classList.add('hidden');
      return;
    }

    const chars = text.length;
    const lines = text.split('\n');
    const emptyLines = lines.filter(l => l.trim() === '').length;
    const words = text;

    // 1. Meta-Cognition & Self-Irony Score (0 - 25)
    let metaScore = 0;
    const metaKeywords = [
      '私', '自分', 'お気づきでしょうか', '掌の上', 'オールドタイプ', '老害', '原理主義',
      '結局', '自虐', '散財', '見栄', '傲慢', '錯覚', '安心感', 'じゃないか', 'わけです',
      '寒イボ', '冷笑', '愚行', '情けない', '惨敗', 'トミノ', '富野'
    ];
    let metaHits = 0;
    metaKeywords.forEach(kw => {
      const match = text.match(new RegExp(kw, 'g'));
      if (match) metaHits += match.length;
    });
    metaScore = Math.min(25, Math.round(metaHits * 2.5) + (chars > 300 ? 5 : 0));

    // 2. Sensory & Concrete Detail Score (0 - 25)
    let detailScore = 0;
    const numberMatches = text.match(/\d+(万|千|度|話|年|人|円|%|割|km|平方|個)/g) || [];
    const detailKeywords = [
      '気温', '汗', '麦茶', '匂い', '雨音', 'エアコン', '冷たさ', '熱風', '唇', '吐息',
      'ザク', 'ガンダム', 'ガンプラ', 'コロニー', 'ISRU', 'プラモ', 'マークII', 'Amazon'
    ];
    let detailHits = 0;
    detailKeywords.forEach(kw => {
      const match = text.match(new RegExp(kw, 'g'));
      if (match) detailHits += match.length;
    });
    detailScore = Math.min(25, (numberMatches.length * 3) + (detailHits * 2) + (chars > 400 ? 5 : 0));

    // 3. Rhythm & Line Tempo Score (0 - 25)
    let tempoScore = 0;
    const ratio = lines.length > 0 ? emptyLines / lines.length : 0;
    if (ratio >= 0.25 && ratio <= 0.65) {
      tempoScore = 25; // Ideal mobile reading layout
    } else if (ratio > 0.1) {
      tempoScore = 18;
    } else {
      tempoScore = 10;
    }

    // 4. Ending Punchline Score (0 - 25)
    let endingScore = 0;
    const lastPart = text.substring(Math.max(0, text.length - 200));
    const endingKeywords = [
      'ことにします', '幸いです', 'オチ', '日常', 'ポチ', '続く', 'じゃねえ', 'お笑い',
      '削る', '帰還', '残酷', 'ループ', '転がされて'
    ];
    let endingHits = 0;
    endingKeywords.forEach(kw => {
      if (lastPart.includes(kw)) endingHits++;
    });
    endingScore = Math.min(25, endingHits * 12 + 5);

    // AI Smell Penalty
    const aiSmellKeywords = [
      'いかがでしたでしょうか', 'いかがでしたか', 'ぜひ試してみて', '素晴らしい未来',
      'まとめると', 'まとめ：', '参考になれば幸いです', '充実した毎日を'
    ];
    let smellFound = [];
    aiSmellKeywords.forEach(kw => {
      if (text.includes(kw)) smellFound.push(kw);
    });

    let totalScore = metaScore + detailScore + tempoScore + endingScore;
    if (smellFound.length > 0) {
      totalScore = Math.max(10, totalScore - (smellFound.length * 20));
      aiSmellAlert.classList.remove('hidden');
      aiSmellDetails.textContent = `検出された定型句: 「${smellFound.join('」「')}」`;
    } else {
      aiSmellAlert.classList.add('hidden');
    }

    totalScore = Math.min(99, Math.max(15, totalScore));

    // Update UI
    synchroScoreVal.textContent = `${totalScore}%`;
    synchroBarFill.style.width = `${totalScore}%`;

    metricMetaVal.textContent = `${metaScore * 4}%`;
    metricMetaFill.style.width = `${metaScore * 4}%`;

    metricDetailVal.textContent = `${detailScore * 4}%`;
    metricDetailFill.style.width = `${detailScore * 4}%`;

    metricTempoVal.textContent = `${tempoScore * 4}%`;
    metricTempoFill.style.width = `${tempoScore * 4}%`;

    metricEndingVal.textContent = `${endingScore * 4}%`;
    metricEndingFill.style.width = `${endingScore * 4}%`;

    if (totalScore >= 85) {
      synchroBadge.textContent = '本人シンクロ極大 (完璧)';
      synchroBadge.className = 'synchro-badge high';
      synchroAdvice.textContent = '🌟 筆者特有の自虐・生々しい解像度・オチが完璧に再現されています！このままnoteに投稿できます。';
    } else if (totalScore >= 65) {
      synchroBadge.textContent = '良好 (たまき度高)';
      synchroBadge.className = 'synchro-badge medium';
      if (endingScore < 15) {
        synchroAdvice.textContent = '💡 オチに「〜することにします」「ま、いいんだけどね」のような自虐の着地を足すと90%超えになります。';
      } else if (metaScore < 15) {
        synchroAdvice.textContent = '💡 自己客観視（「安心感を買っているだけ」「完全に掌の上」）をもう一匙加えるとさらに化けます。';
      } else {
        synchroAdvice.textContent = '💡 推敲アシストボタンでさらにディテールや自虐をアップできます。';
      }
    } else {
      synchroBadge.textContent = '標準・要チューニング';
      synchroBadge.className = 'synchro-badge';
      synchroAdvice.textContent = '💡 改行を入れてスマホ向けにテンポを整え、具体的な数字や自虐ツッコミを注入しましょう。';
    }
  }

  // Quick Rewrite Actions
  rewriteChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const action = chip.dataset.action;
      applyQuickRewrite(action);
    });
  });

  function applyQuickRewrite(action) {
    let text = outputEditor.value;
    if (!text.trim()) {
      showToast('まず文章を生成または入力してください');
      return;
    }

    if (action === 'clean-ai') {
      const aiSmellRegex = /(いかがでしたでしょうか.*|いかがでしたか.*|ぜひ試してみて.*|素晴らしい未来.*|まとめると.*|参考になれば幸いです.*)/g;
      text = text.replace(aiSmellRegex, '').trim();
      outputEditor.value = text;
      showToast('AI臭いテンプレ表現を除去しました！');
    } else if (action === 'more-meta') {
      text += '\n\n……いやはや、格好をつけて色々考察してみたところで、結局は自分の都合のいい安心感を買っているだけに過ぎないわけです。';
      outputEditor.value = text;
      showToast('自虐・メタ認知ツッコミを追加しました！');
    } else if (action === 'more-detail') {
      text += '\n\n（具体的な温度や匂い、生々しい試行錯誤の経過の解像度をさらに深掘り）';
      outputEditor.value = text;
      showToast('具体性メモを追加しました！');
    } else if (action === 'lighter-ending') {
      text += '\n\nま、楽しければいいんじゃね？ ということで、今夜は大人しく積みプラのバリでも削ることにします。';
      outputEditor.value = text;
      showToast('軽やかなオチを付加しました！');
    }

    updateStats();
  }

  btnFixSmell.addEventListener('click', () => {
    applyQuickRewrite('clean-ai');
  });

  // Debounced Editor updates
  let analyzeTimer = null;
  function updateStats() {
    const text = outputEditor.value;
    const len = text.length;
    charCount.textContent = `${len.toLocaleString()} 文字`;
    const minutes = Math.ceil(len / 500);
    readTime.textContent = `読了 約${minutes}分`;

    clearTimeout(analyzeTimer);
    analyzeTimer = setTimeout(() => {
      analyzeText(text);
    }, 250);
  }

  outputEditor.addEventListener('input', updateStats);

  // Tab Switch (Preview / Prompt)
  tabPreview.addEventListener('click', () => {
    state.activeTab = 'preview';
    tabPreview.classList.add('active');
    tabPromptView.classList.remove('active');
    outputEditor.readOnly = false;
    outputEditor.classList.remove('editor-prompt-mode');
    updateStats();
  });

  tabPromptView.addEventListener('click', () => {
    state.activeTab = 'prompt';
    tabPromptView.classList.add('active');
    tabPreview.classList.remove('active');
    state.lastGeneratedPrompt = buildPrompt();
    outputEditor.value = state.lastGeneratedPrompt;
    outputEditor.readOnly = true;
    outputEditor.classList.add('editor-prompt-mode');
    updateStats();
  });

  // ==========================================
  // 9. Prompt Generation & Direct Gemini API
  // ==========================================
  btnBuildPrompt.addEventListener('click', () => {
    const prompt = buildPrompt();
    state.lastGeneratedPrompt = prompt;
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('プロンプトをクリップボードにコピーしました！');
      state.activeTab = 'prompt';
      tabPromptView.classList.add('active');
      tabPreview.classList.remove('active');
      outputEditor.value = prompt;
      outputEditor.readOnly = true;
      updateStats();
    }).catch(() => {
      showToast('プロンプトを生成しました');
    });
  });

  btnAiGenerate.addEventListener('click', async () => {
    if (!state.apiKey) {
      modalApiSettings.classList.remove('hidden');
      apiKeyInput.focus();
      showToast('まずGemini APIキーを設定してください（無料）');
      return;
    }

    const prompt = buildPrompt();
    state.lastGeneratedPrompt = prompt;

    // Switch to Preview tab
    state.activeTab = 'preview';
    tabPreview.classList.add('active');
    tabPromptView.classList.remove('active');
    outputEditor.readOnly = false;

    loadingOverlay.classList.remove('hidden');
    btnAiGenerate.disabled = true;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 3072
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `APIエラー (HTTP ${response.status})`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '生成された文章が空でした。';

      outputEditor.value = generatedText;
      updateStats();
      saveHistory(generatedText);
      showToast('執筆が完了しました！');
    } catch (err) {
      alert(`執筆中にエラーが発生しました:\n${err.message}`);
    } finally {
      loadingOverlay.classList.add('hidden');
      btnAiGenerate.disabled = false;
    }
  });

  // ==========================================
  // 10. Copy & Export Actions
  // ==========================================
  btnCopyOutput.addEventListener('click', () => {
    const text = outputEditor.value;
    if (!text.trim()) {
      showToast('コピーする文章がありません');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast('note用本文をコピーしました！');
    });
  });

  btnDownloadMd.addEventListener('click', () => {
    const text = outputEditor.value;
    if (!text.trim()) {
      showToast('保存する文章がありません');
      return;
    }
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `tamaki_article_${state.currentMode}_${timestamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('.md ファイルをダウンロードしました');
  });

  function showToast(msg) {
    toastMessage.textContent = msg;
    toastMessage.classList.remove('hidden');
    setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 2800);
  }

  // ==========================================
  // 11. History Management
  // ==========================================
  function saveHistory(text) {
    let title = '無題';
    if (state.currentMode === 'essay') {
      title = document.getElementById('essay-theme').value.trim() || 'エッセイ';
    } else if (state.currentMode === 'subculture') {
      title = document.getElementById('subculture-target').value.trim() || 'ガンダム・論考';
    } else if (state.currentMode === 'novel') {
      title = document.getElementById('novel-characters').value.trim() || '小説・描写';
    }

    const item = {
      id: Date.now(),
      mode: state.currentMode,
      title: title,
      text: text,
      date: new Date().toLocaleString('ja-JP')
    };

    state.history.unshift(item);
    if (state.history.length > 30) state.history.pop();
    localStorage.setItem('tamaki_history', JSON.stringify(state.history));
  }

  btnHistory.addEventListener('click', () => {
    renderHistory();
    modalHistory.classList.remove('hidden');
  });

  btnCloseHistoryModal.addEventListener('click', () => {
    modalHistory.classList.add('hidden');
  });

  function renderHistory() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
      historyList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 2rem;">まだ履歴がありません。</p>';
      return;
    }

    state.history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      const modeBadge = item.mode === 'essay' ? '☕ エッセイ' : item.mode === 'subculture' ? '🤖 論考' : '📖 小説';
      el.innerHTML = `
        <div class="history-item-header">
          <span>${modeBadge}</span>
          <span>${item.date}</span>
        </div>
        <div class="history-item-title">${item.title}</div>
        <div class="history-item-preview">${item.text}</div>
      `;
      el.addEventListener('click', () => {
        outputEditor.value = item.text;
        state.activeTab = 'preview';
        tabPreview.classList.add('active');
        tabPromptView.classList.remove('active');
        modalHistory.classList.add('hidden');
        updateStats();
        showToast('履歴から復元しました');
      });
      historyList.appendChild(el);
    });
  }

  btnClearHistory.addEventListener('click', () => {
    if (confirm('履歴をすべて消去しますか？')) {
      state.history = [];
      localStorage.removeItem('tamaki_history');
      renderHistory();
      showToast('履歴を消去しました');
    }
  });

  // ==========================================
  // 12. API Settings Modal
  // ==========================================
  btnApiSettings.addEventListener('click', () => {
    apiKeyInput.value = state.apiKey;
    apiModelSelect.value = state.apiModel;
    modalApiSettings.classList.remove('hidden');
  });

  btnCloseApiModal.addEventListener('click', () => {
    modalApiSettings.classList.add('hidden');
  });

  btnSaveApi.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    const model = apiModelSelect.value;
    state.apiKey = key;
    state.apiModel = model;
    localStorage.setItem('tamaki_gemini_api_key', key);
    localStorage.setItem('tamaki_gemini_model', model);
    modalApiSettings.classList.add('hidden');
    showToast('API設定を保存しました');
  });

  btnFetchModels.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      alert('先にAPIキーを入力してください');
      return;
    }
    modelFetchStatus.style.display = 'block';
    modelFetchStatus.textContent = 'モデル一覧を取得中...';
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || '取得に失敗しました');

      const textModels = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa') &&
        !m.name.includes('tts') &&
        !m.name.includes('audio')
      );

      if (textModels.length === 0) throw new Error('使用可能なテキスト生成モデルが見つかりませんでした');

      apiModelSelect.innerHTML = '';
      textModels.forEach(m => {
        const id = m.name.replace('models/', '');
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${m.displayName || id} (${id})`;
        apiModelSelect.appendChild(opt);
      });

      const preferred = textModels.find(m => m.name.includes('gemini-1.5-flash-latest')) || textModels[0];
      apiModelSelect.value = preferred.name.replace('models/', '');
      modelFetchStatus.textContent = `✅ ${textModels.length}件の利用可能モデルを取得しました！`;
    } catch (err) {
      modelFetchStatus.textContent = `❌ エラー: ${err.message}`;
    }
  });

  // ==========================================
  // 13. Guide Modal
  // ==========================================
  if (btnGuide && modalGuide) {
    btnGuide.addEventListener('click', () => {
      modalGuide.classList.remove('hidden');
    });

    if (btnCloseGuideModal) {
      btnCloseGuideModal.addEventListener('click', () => {
        modalGuide.classList.add('hidden');
      });
    }

    if (btnCloseGuideFooter) {
      btnCloseGuideFooter.addEventListener('click', () => {
        modalGuide.classList.add('hidden');
      });
    }
  }

  // Close modals on backdrop click
  [modalApiSettings, modalHistory, modalGuide].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  // Initial setup
  renderPalette();
  updateStats();
});
