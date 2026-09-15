/**
 * Tamaki Studio v3.0.2 Ultra - Application Logic
 * 鋭いメタ認知、思考の迷走プロセス、高解像度描写、オチのキレ、全入力自動保存・自動復元、ChatGPT推敲連携、無機質デトックスを完全搭載
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
    currentMode: 'essay', // 'detox' | 'essay' | 'subculture' | 'novel'
    activeTab: 'preview', // 'preview' | 'prompt'
    apiKey: localStorage.getItem('tamaki_gemini_api_key') || '',
    apiModel: initialModel,
    history: JSON.parse(localStorage.getItem('tamaki_history') || '[]'),
    lastGeneratedPrompt: '',
    loadedDoc: null, // { name: '', content: '', chars: 0 }
    tuning: {
      tone: 2,        // 1: 冷静・知性派 (クール), 2: 標準 (バランス), 3: 熱量全開 (自虐強め)
      meta: 3,        // 1: 控えめ, 2: 標準, 3: 全開 (筆者特有の自虐)
      turbulence: 3,  // 1: 一直線, 2: 標準, 3: 全開 (思考の揺れ・迷走・二転三転)
      detail: 3,      // 1: 標準, 2: 高解像度, 3: 超高解像度 (生々しさ)
      tempo: 1,       // 1: スマホ短文, 2: 標準, 3: 重厚
      antiAi: true,
      delusion: false // 妄想考察モード（老害の妄執・IF論考）: ON/OFF
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
      "ま、楽しければいいんじゃね？",
      "いや、待てよ。",
      "ここからは完全に私の妄想ですが",
      "オタクの思考実験の沼",
      "💡 このマニアックな事象を、現代のビジネスや組織の理不尽さに例えると？"
    ],
    essay: [
      "安心感を買っているだけに過ぎない",
      "茶店の冷たい麦茶が最強",
      "身の丈に合った準備が最強",
      "道具への依存と格好つけが招いた敗北",
      "日常への静かな帰還と身の丈にあった選択",
      "格好つけて最新ギア買ったのにこのザマ",
      "結局、道具じゃねえ",
      "いや、冷静に考えたらわかるはずなのに"
    ],
    subculture: [
      "自称・オールドタイプ宇宙世紀原理主義者",
      "トミノメモの精査",
      "看板（IP）を背負わせただけの違和感",
      "泥とオイルの匂いがするリアリズム",
      "現場の一兵卒視点のスピンオフ",
      "富野御大の掌の上で転がされている",
      "静かに夜のコーヒーを飲み干すことにします",
      "若きニュータイプに冷笑される前に",
      "💡 このマニアックな事象を、現代のビジネスや組織の理不尽さに例えると？",
      "予算不足の現場における、つじつま合わせの神技"
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

  const presets = {
    essay_golf: {
      mode: 'essay',
      theme: "真夏の酷暑ゴルフと、最新冷却ギア（そして結局効いたもの）",
      experience: `・最高気温37度の炎天下、前半4ホール目で早くも頭痛と意識朦朧。
・気合を入れて買った「ペルチェ素子冷却ベスト（2万8千円）」と「超強力ハンディファン」をフル稼働。
・だがベストは30分でバッテリー切れ、ファンは熱風を吹き付けるだけのドライヤーと化す。
・同伴者に「それ、ただの重りじゃん」と笑われ、結局一番生き返ったのは茶店のおばちゃんがくれた無料の麦茶と冷たいおしぼりだった。
・道具への依存と格好つけが招いた惨敗。`,
      insight: `テクノロジーで自然の猛威をねじ伏せようとする現代人の傲慢と見栄。最新ギアを買い揃える行為は、暑さ対策というより「万全な自分」という安心感を買っているだけに過ぎない。自然の前では無理せず撤退する勇気と冷たい麦茶が最強。`,
      ending: `テクノロジーに過剰依存せず、素直に麦茶とおしぼりで涼をとり、無茶をせず引き上げる。身の丈に合った準備をしておくことこそが、一番の自衛策なのかもしれない。`
    },
    essay_gadget: {
      mode: 'essay',
      theme: "作業効率化という名目で揃えたデスク周辺機器と、身の丈にあった道具選び",
      experience: `・「これで生産性が2倍になる」と信じて購入したエルゴノミクスキーボード（4万5千円）と4K曲面ウルトラワイドモニター。
・配線整理に丸一日費やし、デスクはまるでNASAの管制室。
・だが実際に始めた作業は、モニターのカラーキャリブレーションと新しい壁紙探し。
・キー配列の違いに指が攣りそうになり、結局使い慣れたMacBookのペタペタキーボードに戻る始末。`,
      insight: `「道具を揃えれば自分が有能になる」という錯覚。高価なツールを愛でている時間は最もタスクが進んでいない時間であるという皮肉な真実。`,
      ending: `環境構築の泥沼にハマるのをやめ、身の丈にあった道具でシンプルに作業に向き合うこと。一番必要なのは新しいキーボードではなく、静かに画面と向き合う集中力なのだ。`
    },
    subculture_gundam52: {
      mode: 'subculture',
      target: "機動戦士ガンダム 全52話打ち切りIF / トミノメモと宇宙世紀の生存",
      doubts: `・「もしファーストガンダムが全52話完走していたら今日のガンダムブームは存在しなかった」という逆説。
・打ち切り決定によって全43話に凝縮されたからこそ、作品純度が極限まで高まり、1980年7月のガンプラ（300円）の爆発的熱狂に繋がった。
・トミノメモの構想通りなら、シャアはア・バオア・クーで戦死していた。シャア不在ならZのクワトロも逆シャアもハサウェイも消滅していたという寒イボの立つ事実。`,
      insight: `・アニメ制作者最大の敗北である「打ち切り」を、富野由悠季という巨匠は極上の劇薬（ファンの飢餓感・神話化）へと変えてみせた。
・仮にシャアとアムロの超人劇が早期終結した世界線では、むしろコミックボンボンやMSV、横山宏氏や小林誠氏のような「泥とオイルの匂いがする現場一兵卒のミリタリーSF」が爆発していた可能性。
・商業構造と作家性の奇跡的な化学反応の考察。`,
      ending: `……いやあ、完全に富野御大の掌の上で転がされているだけじゃないですか、私。手元の資料を閉じ、静かに夜のコーヒーを飲み干すことにします。単なるオールドタイプの夜戯言とお笑いくだされば幸いです。`
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
  const phraseSelect = document.getElementById('phrase-select');
  const sensorySelect = document.getElementById('sensory-select');

  // Fields Containers
  const fieldsDetox = document.getElementById('fields-detox');
  const detoxInput = document.getElementById('detox-input');
  const detoxCharCount = document.getElementById('detox-char-count');
  const detoxHistorySelect = document.getElementById('detox-history-select');
  const btnSaveDetoxMemo = document.getElementById('btn-save-detox-memo');
  const btnSendToStudio = document.getElementById('btn-send-to-studio');

  const fieldsEssay = document.getElementById('fields-essay');
  const fieldsSubculture = document.getElementById('fields-subculture');
  const fieldsNovel = document.getElementById('fields-novel');

  // Dual Monologue ('鍵'式 独白交代モード v4.1)
  const toggleDualMonologue = document.getElementById('toggle-dual-monologue');
  const dualMonologuePanel = document.getElementById('dual-monologue-panel');
  const dualNameMale = document.getElementById('dual-name-male');
  const dualNameFemale = document.getElementById('dual-name-female');
  const btnDualTabMale = document.getElementById('btn-dual-tab-male');
  const btnDualTabFemale = document.getElementById('btn-dual-tab-female');
  const colDualMale = document.getElementById('col-dual-male');
  const colDualFemale = document.getElementById('col-dual-female');
  const dualInputMale = document.getElementById('dual-input-male');
  const dualInputFemale = document.getElementById('dual-input-female');
  const countDualMale = document.getElementById('count-dual-male');
  const countDualFemale = document.getElementById('count-dual-female');
  const badgeColMale = document.getElementById('badge-col-male');
  const badgeColFemale = document.getElementById('badge-col-female');
  const labelTabMale = document.getElementById('label-tab-male');
  const labelTabFemale = document.getElementById('label-tab-female');
  const btnMergeDual = document.getElementById('btn-merge-dual');

  // Sliders
  const sliderTone = document.getElementById('slider-tone');
  const sliderMeta = document.getElementById('slider-meta');
  const sliderTurbulence = document.getElementById('slider-turbulence');
  const sliderDetail = document.getElementById('slider-detail');
  const sliderTempo = document.getElementById('slider-tempo');
  const valTone = document.getElementById('val-tone');
  const valMeta = document.getElementById('val-meta');
  const valTurbulence = document.getElementById('val-turbulence');
  const valDetail = document.getElementById('val-detail');
  const valTempo = document.getElementById('val-tempo');
  const toggleAntiAi = document.getElementById('toggle-anti-ai');
  const toggleDelusion = document.getElementById('toggle-delusion');
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
  const btnCopyChatgpt = document.getElementById('btn-copy-chatgpt');
  const btnDownloadMd = document.getElementById('btn-download-md');
  const toastMessage = document.getElementById('toast-message');

  // Synchro-Meter & AI Smell / Fact Check / Compliance
  const synchroScoreVal = document.getElementById('synchro-score-val');
  const synchroBadge = document.getElementById('synchro-badge');
  const synchroBarFill = document.getElementById('synchro-bar-fill');
  const metricMetaVal = document.getElementById('metric-meta-val');
  const metricMetaFill = document.getElementById('metric-meta-fill');
  const metricTurbulenceVal = document.getElementById('metric-turbulence-val');
  const metricTurbulenceFill = document.getElementById('metric-turbulence-fill');
  const metricDetailVal = document.getElementById('metric-detail-val');
  const metricDetailFill = document.getElementById('metric-detail-fill');
  const metricEndingVal = document.getElementById('metric-ending-val');
  const metricEndingFill = document.getElementById('metric-ending-fill');
  const synchroAdvice = document.getElementById('synchro-advice');

  const complianceAlert = document.getElementById('compliance-alert');
  const complianceDetails = document.getElementById('compliance-details');
  const btnAnonymizeNames = document.getElementById('btn-anonymize-names');

  const factCheckAlert = document.getElementById('fact-check-alert');
  const factCheckDetails = document.getElementById('fact-check-details');
  const aiSmellAlert = document.getElementById('ai-smell-alert');
  const aiSmellDetails = document.getElementById('ai-smell-details');
  const btnFixSmell = document.getElementById('btn-fix-smell');
  const rewriteChips = document.querySelectorAll('.rewrite-chip');

  // Proofreading Inspector (v4.0)
  const proofreadInspector = document.getElementById('proofread-inspector');
  const proofreadBadge = document.getElementById('proofread-badge');
  const btnToggleProofread = document.getElementById('btn-toggle-proofread');
  const proofreadToggleText = document.getElementById('proofread-toggle-text');
  const proofreadToggleArrow = document.getElementById('proofread-toggle-arrow');
  const proofreadBody = document.getElementById('proofread-body');
  const proofreadList = document.getElementById('proofread-list');
  const btnFixAllProofread = document.getElementById('btn-fix-all-proofread');

  // Polish Diff Studio (v4.0)
  const btnPolishTamaki = document.getElementById('btn-polish-tamaki');
  const btnPolishProofread = document.getElementById('btn-polish-proofread');
  const modalPolishDiff = document.getElementById('modal-polish-diff');
  const btnClosePolishModal = document.getElementById('btn-close-polish-modal');
  const polishModalTitle = document.getElementById('polish-modal-title');
  const polishAdviceText = document.getElementById('polish-advice-text');
  const tabViewDiff = document.getElementById('tab-view-diff');
  const tabViewRaw = document.getElementById('tab-view-raw');
  const diffViewContent = document.getElementById('diff-view-content');
  const polishedRawText = document.getElementById('polished-raw-text');
  const diffStatsPill = document.getElementById('diff-stats-pill');
  const btnCopyPolished = document.getElementById('btn-copy-polished');
  const btnApplyPolished = document.getElementById('btn-apply-polished');

  // Outline Drawer & Selection Polish (v4.1)
  const btnToggleOutline = document.getElementById('btn-toggle-outline');
  const btnCloseOutline = document.getElementById('btn-close-outline');
  const outlineDrawer = document.getElementById('outline-drawer');
  const outlineItems = document.getElementById('outline-items');
  const outlineCountBadge = document.getElementById('outline-count-badge');
  const selectionPolishBadge = document.getElementById('selection-polish-badge');
  const selectedCharCount = document.getElementById('selected-char-count');

  // Privacy Dictionary (v4.1)
  const btnPrivacyDict = document.getElementById('btn-privacy-dict');
  const modalPrivacyDict = document.getElementById('modal-privacy-dict');
  const btnClosePrivacyModal = document.getElementById('btn-close-privacy-modal');
  const btnClosePrivacyFooter = document.getElementById('btn-close-privacy-footer');
  const dictInputReal = document.getElementById('dict-input-real');
  const dictInputFic = document.getElementById('dict-input-fic');
  const btnAddDictEntry = document.getElementById('btn-add-dict-entry');
  const privacyDictTbody = document.getElementById('privacy-dict-tbody');
  const btnLoadDictPresets = document.getElementById('btn-load-dict-presets');
  const btnExportDictJson = document.getElementById('btn-export-dict-json');
  const btnImportDictJson = document.getElementById('btn-import-dict-json');
  const dictFileInput = document.getElementById('dict-file-input');
  const btnApplyPrivacyAll = document.getElementById('btn-apply-privacy-all');
  const btnApplyPrivacyDictFooter = document.getElementById('btn-apply-privacy-dict-footer');

  // Kindle (KDP) & EPUB Studio (v4.1)
  const btnKdpExport = document.getElementById('btn-kdp-export');
  const btnExportKdpFooter = document.getElementById('btn-export-kdp-footer');
  const modalKdpExport = document.getElementById('modal-kdp-export');
  const btnCloseKdpModal = document.getElementById('btn-close-kdp-modal');
  const btnCloseKdpFooter = document.getElementById('btn-close-kdp-footer');
  const kdpBookTitle = document.getElementById('kdp-book-title');
  const kdpBookAuthor = document.getElementById('kdp-book-author');
  const btnDownloadEpub = document.getElementById('btn-download-epub');
  const btnDownloadKdpMd = document.getElementById('btn-download-kdp-md');
  const btnCopyKdpText = document.getElementById('btn-copy-kdp-text');
  const kdpVerticalViewer = document.getElementById('kdp-vertical-viewer');

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

  // Mobile / iPhone Elements
  const btnMobileSync = document.getElementById('btn-mobile-sync');
  const modalMobileSync = document.getElementById('modal-mobile-sync');
  const btnCloseMobileModal = document.getElementById('btn-close-mobile-modal');
  const btnCloseMobileFooter = document.getElementById('btn-close-mobile-footer');
  const qrcodeContainer = document.getElementById('qrcode-container');
  const mobileAccessUrl = document.getElementById('mobile-access-url');
  const btnCopyMobileUrl = document.getElementById('btn-copy-mobile-url');

  const mobileBottomNav = document.getElementById('mobile-bottom-nav');
  const btnMobTabInput = document.getElementById('btn-mob-tab-input');
  const btnMobTabEditor = document.getElementById('btn-mob-tab-editor');
  const mobSyncPill = document.getElementById('mob-sync-pill');

  // Mobile View Switcher
  function setMobileView(view) {
    if (view === 'editor') {
      document.body.classList.remove('mobile-view-input');
      document.body.classList.add('mobile-view-editor');
      if (btnMobTabEditor) btnMobTabEditor.classList.add('active');
      if (btnMobTabInput) btnMobTabInput.classList.remove('active');
    } else {
      document.body.classList.remove('mobile-view-editor');
      document.body.classList.add('mobile-view-input');
      if (btnMobTabInput) btnMobTabInput.classList.add('active');
      if (btnMobTabEditor) btnMobTabEditor.classList.remove('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btnMobTabInput) {
    btnMobTabInput.addEventListener('click', () => setMobileView('input'));
  }
  if (btnMobTabEditor) {
    btnMobTabEditor.addEventListener('click', () => setMobileView('editor'));
  }

  // Set initial mobile view
  document.body.classList.add('mobile-view-input');

  // Track active input for phrase insertion
  // Track active input for phrase/sensory insertion
  let lastActiveInput = null;
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('focus', () => {
      lastActiveInput = el;
    });
  });

  // ==========================================
  // 4. UI Interactions & Mode Switch
  // ==========================================

  // Sensory Texture Palette Dictionary (v4.1 あずますくね風『日常の静寂と秘められた微熱』)
  const sensoryPaletteDictionary = {
    visual: {
      label: '👁️ 視覚（光と影・視線・情景）',
      items: [
        'ブラインドの隙間から細く差し込む夕暮れの西日',
        '街灯のオレンジ色に濡れて鈍く光るアスファルト',
        '暗がりの中で白く浮かび上がるうなじの輪郭',
        '結露したグラスの表面を滑り落ちる一筋の水滴',
        '雨粒が窓ガラスを斜めに伝い、街のネオンを滲ませる',
        '伏せられた長い睫毛が落とすわずかな影',
        '車のヘッドライトが一瞬だけ二人の横顔を白く照らす',
        '薄暗い事務所の片隅、PCモニターの青白い残光'
      ]
    },
    audio: {
      label: '👂 聴覚（静寂・環境音・微音）',
      items: [
        '静まり返った部屋に響くエアコンの低い唸り',
        'フロントガラスを規則的に叩く鈍い雨音',
        '耳元でかすかに乱れる浅い呼吸音',
        '衣擦れの乾いた絹鳴りの音',
        '氷がグラスの底でカランと小さく鳴る音',
        '壁の時計が刻む無機質な秒針の音だけが響く',
        '遠くの幹線道路を大型トラックが走り去る重低音',
        'ため息ともつかない、微かな息の吐き出し'
      ]
    },
    olfactory: {
      label: '👃 嗅覚（匂い・煙・体香）',
      items: [
        '湿り気を帯びた煙草の葉とライターのオイルの匂い',
        '微かに残る石鹸と、雨に濡れたコートの匂い',
        '革シートの冷えた匂いと、密閉された車内の空気',
        '熱を帯びた肌から立ちのぼる微かな甘い香り',
        '雨上がりのアスファルトから立ち込める特有の土埃の匂い',
        'すれ違いざまに掠めた微量のパフュームの残り香',
        '冷えた夜風に混じる、誰かの柔軟剤の匂い'
      ]
    },
    tactile: {
      label: '✋ 触感（温度・質感・微熱）',
      items: [
        '触れ合う指先の微かな温度差と湿り気',
        '肌に張り付くシルクブラウスのひやりとした感触',
        '首筋にそっと触れた手のひらに伝わる静かな微熱',
        'グラスの結露を拭った指先の冷たさ',
        'ざらりとしたウール越しに感じる確かな体温',
        '震えを悟られまいと指先をきつく握り締める感覚',
        '襟元を緩めたときに首筋を抜ける冷たい夜気'
      ]
    },
    somatic: {
      label: '🫀 生理・心理（身体反応・沈黙）',
      items: [
        '言葉を探すあいだに喉の奥が微かに渇く感覚',
        '静寂の中で自分の心拍が耳の奥で跳ねる',
        '視線が絡み合った瞬間に背筋を走る微弱な悪寒',
        '会話が途切れた部屋に落ちる、息の詰まるような沈黙',
        '冷静を装う呼吸のテンポがわずかに狂う',
        '心のどこかで「自分は何をしているのか」と冷徹に眺める自意識',
        '引き返せなくなる境界線を越えてしまった確信'
      ]
    }
  };

  function renderSensoryPalette() {
    if (!sensorySelect) return;
    sensorySelect.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '🎨 五感サンプリング（微熱・光と影・匂い・音）を選択...';
    sensorySelect.appendChild(defaultOpt);

    Object.keys(sensoryPaletteDictionary).forEach(key => {
      const group = sensoryPaletteDictionary[key];
      const optGroup = document.createElement('optgroup');
      optGroup.label = group.label;
      group.items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        optGroup.appendChild(opt);
      });
      sensorySelect.appendChild(optGroup);
    });
  }

  function renderPalette() {
    if (!phraseSelect) return;
    phraseSelect.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '🧩 語録・思考トリガーを選択して現在の欄に挿入...';
    phraseSelect.appendChild(defaultOpt);

    const mode = state.currentMode;
    let modeSpecificPhrases = [];
    let modeLabel = '現在のモード向け';

    if (mode === 'essay') {
      modeSpecificPhrases = phraseDictionary.essay || [];
      modeLabel = '☕ エッセイ・日常・自虐フレーズ';
    } else if (mode === 'subculture') {
      modeSpecificPhrases = [...(phraseDictionary.subculture || []), ...(phraseDictionary.colony_sf || [])];
      modeLabel = '🤖 ガンダム・SF・原理主義フレーズ';
    } else if (mode === 'novel') {
      modeSpecificPhrases = phraseDictionary.novel || [];
      modeLabel = '🎭 小説・ドラマ・心理描写フレーズ';
    }

    if (modeSpecificPhrases.length > 0) {
      const optGroupMode = document.createElement('optgroup');
      optGroupMode.label = modeLabel;
      Array.from(new Set(modeSpecificPhrases)).forEach(phrase => {
        const opt = document.createElement('option');
        opt.value = phrase;
        opt.textContent = phrase;
        optGroupMode.appendChild(opt);
      });
      phraseSelect.appendChild(optGroupMode);
    }

    if (phraseDictionary.common && phraseDictionary.common.length > 0) {
      const optGroupCommon = document.createElement('optgroup');
      optGroupCommon.label = '🔥 汎用・思考トリガー・オチ';
      Array.from(new Set(phraseDictionary.common)).forEach(phrase => {
        const opt = document.createElement('option');
        opt.value = phrase;
        opt.textContent = phrase;
        optGroupCommon.appendChild(opt);
      });
      phraseSelect.appendChild(optGroupCommon);
    }

    renderSensoryPalette();
  }

  if (phraseSelect) {
    phraseSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        insertPhraseToForm(val);
        e.target.value = '';
      }
    });
  }

  if (sensorySelect) {
    sensorySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        insertPhraseToForm(val);
        e.target.value = '';
      }
    });
  }

  function insertPhraseToForm(phrase) {
    let target = lastActiveInput;
    if (!target || !document.body.contains(target) || (target !== outputEditor && target.closest('.mode-fields.hidden'))) {
      if (state.currentMode === 'novel') {
        if (toggleDualMonologue && toggleDualMonologue.checked && dualInputMale && !dualInputMale.closest('.hidden')) {
          target = dualInputMale;
        } else {
          target = document.getElementById('novel-focus') || outputEditor;
        }
      } else if (state.currentMode === 'essay') {
        target = document.getElementById('essay-experience') || outputEditor;
      } else if (state.currentMode === 'subculture') {
        target = document.getElementById('subculture-doubts') || outputEditor;
      } else {
        target = outputEditor;
      }
    }

    if (target) {
      target.focus();
      const start = target.selectionStart !== undefined ? target.selectionStart : target.value.length;
      const end = target.selectionEnd !== undefined ? target.selectionEnd : target.value.length;
      const text = target.value;
      const prefix = (start > 0 && text[start - 1] !== '\n' && text[start - 1] !== ' ') ? ' ' : '';
      target.value = text.substring(0, start) + prefix + phrase + text.substring(end);
      const newPos = start + prefix.length + phrase.length;
      if (target.setSelectionRange) {
        target.setSelectionRange(newPos, newPos);
      }
      showToast(`「${phrase.substring(0, 16)}...」を挿入しました`);
      
      // If inserted into outputEditor, recalculate sync and proofread
      if (target === outputEditor) {
        updateOutputStats();
        runDebouncedProofread();
        updateOutline();
      }
    }
  }

  function setMode(mode) {
    state.currentMode = mode;
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    if (fieldsDetox) fieldsDetox.classList.toggle('hidden', mode !== 'detox');
    fieldsEssay.classList.toggle('hidden', mode !== 'essay');
    fieldsSubculture.classList.toggle('hidden', mode !== 'subculture');
    fieldsNovel.classList.toggle('hidden', mode !== 'novel');

    if (mode === 'detox') {
      formTitle.textContent = '🚽 言葉の水路の掃除（無機質デトックス）';
    } else if (mode === 'essay') {
      formTitle.textContent = '☕ エッセイ執筆設定';
    } else if (mode === 'subculture') {
      formTitle.textContent = '🤖 ガンダム・サブカル論考執筆設定';
    } else if (mode === 'novel') {
      formTitle.textContent = '📖 小説・官能描写執筆設定';
    }

    renderPalette();
  }

  // ==========================================
  // Detox Mode History & Auto Backup (v4.1)
  // ==========================================
  const DETOX_HISTORY_KEY = 'tamaki_detox_history';

  function getDetoxHistory() {
    try {
      const raw = localStorage.getItem(DETOX_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDetoxToHistory(text) {
    if (!text || !text.trim()) return;
    try {
      const list = getDetoxHistory();
      const entry = {
        id: 'detox_' + Date.now(),
        timestamp: Date.now(),
        preview: text.trim().substring(0, 30).replace(/\n/g, ' '),
        content: text.trim()
      };
      // Keep up to 30 history items
      const updated = [entry, ...list.filter(item => item.content !== text.trim())].slice(0, 30);
      localStorage.setItem(DETOX_HISTORY_KEY, JSON.stringify(updated));
      renderDetoxHistoryOptions();
    } catch (e) {
      console.warn('Failed to save detox history:', e);
    }
  }

  function renderDetoxHistoryOptions() {
    if (!detoxHistorySelect) return;
    detoxHistorySelect.innerHTML = '';
    const list = getDetoxHistory();
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = `📜 過去の落書き履歴 (${list.length}件)...`;
    detoxHistorySelect.appendChild(defaultOpt);

    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      const dateStr = new Date(item.timestamp).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      opt.textContent = `${dateStr}: ${item.preview}...`;
      detoxHistorySelect.appendChild(opt);
    });
  }

  if (detoxHistorySelect) {
    detoxHistorySelect.addEventListener('change', (e) => {
      const id = e.target.value;
      if (!id) return;
      const list = getDetoxHistory();
      const found = list.find(item => item.id === id);
      if (found && detoxInput) {
        if (detoxInput.value && detoxInput.value !== found.content) {
          if (!confirm('現在の入力内容を履歴の落書きで置き換えますか？')) {
            e.target.value = '';
            return;
          }
        }
        detoxInput.value = found.content;
        detoxCharCount.textContent = `${found.content.length} 文字`;
        showToast('📜 過去の落書きメモを復元しました');
      }
      e.target.value = '';
    });
  }

  if (btnSaveDetoxMemo) {
    btnSaveDetoxMemo.addEventListener('click', () => {
      const text = detoxInput ? detoxInput.value : '';
      if (!text.trim()) {
        showToast('保存する落書きテキストがありません');
        return;
      }
      saveDetoxToHistory(text);
      showToast('💾 落書きスナップショットを履歴に保存しました');
    });
  }

  // Detox Input Events
  if (detoxInput && detoxCharCount) {
    detoxInput.addEventListener('input', () => {
      const len = detoxInput.value.length;
      detoxCharCount.textContent = `${len} 文字`;
    });
  }

  // Send Detox Content to AI Studio Form
  if (btnSendToStudio) {
    btnSendToStudio.addEventListener('click', () => {
      const text = detoxInput ? detoxInput.value.trim() : '';
      if (!text) {
        showToast('吐き出した文章が空です。感情やメモを入力してください。');
        return;
      }

      // Always backup to history first
      saveDetoxToHistory(text);

      // Transfer text to essay experience field
      const expField = document.getElementById('essay-experience');
      if (expField) {
        expField.value = expField.value ? `${expField.value}\n\n【デトックスメモ】\n${text}` : text;
      }
      
      // Auto set theme if empty
      const themeField = document.getElementById('essay-theme');
      if (themeField && !themeField.value) {
        const line1 = text.split('\n')[0].replace(/^[・\s\-]+/, '');
        themeField.value = line1.substring(0, 30);
      }

      // Switch to Essay mode
      setMode('essay');
      showToast('🚀 落書きを履歴保存し、本編執筆フォームへ展開しました！');
    });
  }

  // ==========================================
  // Dual Monologue Mode ('鍵'式 独白交代モード v4.1)
  // ==========================================
  if (toggleDualMonologue && dualMonologuePanel) {
    toggleDualMonologue.addEventListener('change', () => {
      dualMonologuePanel.classList.toggle('hidden', !toggleDualMonologue.checked);
      if (toggleDualMonologue.checked) {
        showToast('🗝️ 『鍵』式・独白交代モードを有効化しました');
      }
    });
  }

  function updateDualNames() {
    const maleName = (dualNameMale && dualNameMale.value.trim()) || '俺';
    const femaleName = (dualNameFemale && dualNameFemale.value.trim()) || '保江';

    if (badgeColMale) badgeColMale.textContent = `👤 ${maleName}（男性視点）の独白・心理戦`;
    if (badgeColFemale) badgeColFemale.textContent = `👠 ${femaleName}（女性視点）の独白・微熱`;
    if (labelTabMale) labelTabMale.textContent = `${maleName}の独白`;
    if (labelTabFemale) labelTabFemale.textContent = `${femaleName}の独白`;
  }

  if (dualNameMale) dualNameMale.addEventListener('input', updateDualNames);
  if (dualNameFemale) dualNameFemale.addEventListener('input', updateDualNames);

  // Dual Monologue character count
  if (dualInputMale && countDualMale) {
    dualInputMale.addEventListener('input', () => {
      countDualMale.textContent = `${dualInputMale.value.length}字`;
    });
  }
  if (dualInputFemale && countDualFemale) {
    dualInputFemale.addEventListener('input', () => {
      countDualFemale.textContent = `${dualInputFemale.value.length}字`;
    });
  }

  // Mobile Tabs for Dual Monologue
  if (btnDualTabMale && btnDualTabFemale && colDualMale && colDualFemale) {
    btnDualTabMale.addEventListener('click', () => {
      btnDualTabMale.classList.add('active');
      btnDualTabFemale.classList.remove('active');
      colDualMale.classList.remove('mobile-hidden');
      colDualFemale.classList.add('mobile-hidden');
    });

    btnDualTabFemale.addEventListener('click', () => {
      btnDualTabFemale.classList.add('active');
      btnDualTabMale.classList.remove('active');
      colDualFemale.classList.remove('mobile-hidden');
      colDualMale.classList.add('mobile-hidden');
    });
  }

  // Merge Dual Monologues Interleaved into Editor
  if (btnMergeDual) {
    btnMergeDual.addEventListener('click', () => {
      const maleName = (dualNameMale && dualNameMale.value.trim()) || '俺';
      const femaleName = (dualNameFemale && dualNameFemale.value.trim()) || '保江';
      const maleText = dualInputMale ? dualInputMale.value.trim() : '';
      const femaleText = dualInputFemale ? dualInputFemale.value.trim() : '';

      if (!maleText && !femaleText) {
        showToast('二人の独白が空です。文章を入力してください。');
        return;
      }

      const maleParas = maleText ? maleText.split(/\n\n+/).filter(p => p.trim()) : [];
      const femaleParas = femaleText ? femaleText.split(/\n\n+/).filter(p => p.trim()) : [];

      const mergedSections = [];
      const maxLen = Math.max(maleParas.length, femaleParas.length);

      for (let i = 0; i < maxLen; i++) {
        if (i < maleParas.length) {
          mergedSections.push(`## 【${maleName}の独白】\n${maleParas[i]}`);
        }
        if (i < femaleParas.length) {
          mergedSections.push(`## 【${femaleName}の独白】\n${femaleParas[i]}`);
        }
      }

      const finalMerged = mergedSections.join('\n\n');
      if (outputEditor) {
        outputEditor.value = finalMerged;
        updateOutputStats();
        runDebouncedProofread();
        updateOutline();
        setMobileView('editor');
        showToast(`🔀 ${maleName}と${femaleName}の独白を交互にマージして展開しました！`);
      }
    });
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
  const toneLabels = { 1: '冷静・知性派 (クール)', 2: '標準 (バランス)', 3: '熱量全開 (自虐強め)' };
  const metaLabels = { 1: '控えめ', 2: '標準', 3: '全開 (自虐・迷い多め)' };
  const turbulenceLabels = { 1: '一直線 (論理的)', 2: '標準 (適度な寄り道)', 3: '全開 (思考の揺れ・迷走)' };
  const detailLabels = { 1: '標準', 2: '高解像度', 3: '超高解像度 (生々しい具体性)' };
  const tempoLabels = { 1: 'スマホ向け (改行・余白多め)', 2: '標準', 3: '重厚 (じっくり読ませる)' };

  sliderTone.addEventListener('input', (e) => {
    state.tuning.tone = parseInt(e.target.value, 10);
    valTone.textContent = toneLabels[state.tuning.tone];
  });

  sliderMeta.addEventListener('input', (e) => {
    state.tuning.meta = parseInt(e.target.value, 10);
    valMeta.textContent = metaLabels[state.tuning.meta];
  });

  sliderTurbulence.addEventListener('input', (e) => {
    state.tuning.turbulence = parseInt(e.target.value, 10);
    valTurbulence.textContent = turbulenceLabels[state.tuning.turbulence];
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

  if (toggleDelusion) {
    toggleDelusion.addEventListener('change', (e) => {
      state.tuning.delusion = e.target.checked;
    });
  }

  btnResetTuning.addEventListener('click', () => {
    sliderTone.value = 2;
    sliderMeta.value = 3;
    sliderTurbulence.value = 3;
    sliderDetail.value = 3;
    sliderTempo.value = 1;
    toggleAntiAi.checked = true;
    if (toggleDelusion) toggleDelusion.checked = false;
    state.tuning = { tone: 2, meta: 3, turbulence: 3, detail: 3, tempo: 1, antiAi: true, delusion: false };
    valTone.textContent = toneLabels[2];
    valMeta.textContent = metaLabels[3];
    valTurbulence.textContent = turbulenceLabels[3];
    valDetail.textContent = detailLabels[3];
    valTempo.textContent = tempoLabels[1];
    showToast('チューニングをリセットしました');
  });

  // ==========================================
  // 7. Prompt Builder Engine (Few-Shot Injection & Strict Anti-Academic Rules)
  // ==========================================
  function buildPrompt() {
    const mode = state.currentMode;
    const tuning = state.tuning;

    let toneInstruction = "";
    if (tuning.tone === 1) {
      toneInstruction = "【最重要文体トーン：冷静・知性派 (クール)】過度な自虐や感情的なセルフツッコミ、大げさな表現を抑え、理知的で冷静かつ落ち着いた語り口で執筆すること。鋭いメタ認知や具体的な描写力は保ちつつも、静かで知性ある大人の文脈に仕上げること。";
    } else if (tuning.tone === 3) {
      toneInstruction = "【最重要文体トーン：熱量全開 (自虐強め)】鋭い自虐、感情の揺れ、強烈なセルフツッコミを前面に出し、人間味溢れる熱いテンションで一気に読ませること。";
    } else {
      toneInstruction = "【文体トーン：標準 (バランス)】等身大の知性と適度な自虐・セルフツッコミを交え、親しみやすくユーモラスに執筆すること。";
    }

    let metaInstruction = "";
    if (tuning.meta === 3) {
      const metaExample = mode === 'subculture' ? "「……お気づきでしょうか」「完全に富野御大の掌の上」" : "「……お気づきでしょうか」「安心感を買っているだけ」「自分の勘違いだったわけです」";
      metaInstruction = `【最重要：メタ認知・自虐】鋭いメタ認知（自己客観視）と自虐・セルフツッコミを出し、格好つけや迷いをユーモラスに自己開示すること。${metaExample}などの皮肉な自省を入れること。`;
    } else if (tuning.meta === 2) {
      metaInstruction = "適度に自分を客観視し、冷静な大人の視座を保つこと。";
    } else {
      metaInstruction = "自己開示やツッコミは控えめに、客観的な事象を軸に記述すること。";
    }

    let turbulenceInstruction = "";
    if (tuning.turbulence === 3) {
      const turbLabel = mode === 'subculture' ? "（オタクの思考実験）" : "（試行錯誤・自問自答）";
      turbulenceInstruction = `【最重要：思考の迷走プロセス${turbLabel}】一直線に綺麗すぎる起承転結で論理を固めてはならない。「調べる → 変な引っかかりに気づく → じゃあこうじゃね？と仮説を立てる → いや待てよと立ち止まり疑う → 思考が二転三転する」という生々しいプロセスを残すこと。`;
    } else if (tuning.turbulence === 2) {
      turbulenceInstruction = "適度に思考の寄り道や自問自答を挟み、平坦な説明文にならないようにすること。";
    } else {
      turbulenceInstruction = "論理的に一直線に要点を論じること。";
    }

    let detailInstruction = "";
    if (tuning.detail === 3) {
      detailInstruction = "【超高解像度】抽象表現は厳禁。具体的な固有名詞、日付・年月日、温度、触覚、匂い、金額（円）、生々しい試行錯誤の経過、道具・型番名を高い解像度で描写すること。";
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

    let modeSpecificRule = "";
    if (mode === 'essay') {
      modeSpecificRule = `
## 【最重要規則：ガンダム・サブカルネタの完全排除】
- ユーザーが【テーマ】や【実体験】等で明示的にガンダムや特定のサブカルチャー作品をテーマ・ネタに指定しない限り、ガンダムネタ、宇宙世紀用語（ザク、富野、トミノメモ等）、アニメ・漫画の例え話を文章中に一切含めないこと。
- 日常の実体験、失敗談、買い物、人間観察、物事の本質考察のみに専念すること。
`;
    }

    const antiAiExampleDelusion = mode === 'subculture' ? "「ここからは完全に私の妄想（老害の妄執タイム）ですが」" : "「ここからは完全に私の妄想（独断と偏見タイム）ですが」";
    const antiAiExampleLogic = mode === 'subculture' ? "トミノメモや設定資料の該当記述・話数ディテール" : "具体的な数値・日付・現場のディテール";

    const delusionRule = tuning.delusion
      ? `- 🎯 【妄想境界の明示】史実・前提の解説から大胆なIFや妄想考察に突入する際は、${antiAiExampleDelusion}と明確に境界線を宣言して読者を乗っからせること。`
      : `- 🔍 【客観的・構造的考察】過度な「妄想」やIF宣言はおこなわず、史実・データ・背景構造を軸とした自然で論理的な分析を展開すること。`;

    const antiAiInstruction = tuning.antiAi ? `
## 厳格な禁止事項（AI臭さ・論文調の完全排除ルール）
- ❌ 抽象的な比喩三連発（例：「絶望的な打撃」「作品の純度を極限まで高め」「熱量を爆発させた火種」等）や、論文調の結び（「〜と考えられます」「〜と言えるでしょう」「〜が示唆されます」）は厳禁。
- ⭕ 「〜なんじゃないかと思うんですよ」「〜じゃね？」「〜というわけです」といった飾らない口語・雑な断定・生々しい本音を貫くこと。
- ❌ 「いかがでしたでしょうか？」「〜してみてはいかがでしょうか」「素晴らしい未来が待っています」「ぜひ試してみてください」「まとめると」などの紋切り型まとめは厳禁。
- ❌ 辞書にない不自然なAI誤変換・造語を出力しないこと。
- ❌ **【安直な物欲自虐オチの禁止】**: 結びで「Amazonでポチる」「散財ループは続く」「メルカリで買い直す」等の安直な物欲・買いもの自虐ネタで逃げないこと。日常の発見や身の丈にあった本質的・静かな着地にすること。
${delusionRule}
- 🔍 【論理の核の具体化】一番大事な主張・仮説の根拠を「推察されます」「確認できませんでした」とお茶を濁さず、${antiAiExampleLogic}を具体的に挙げて論理を補強すること。
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

……いや、待てよ。冷静に考えれば、テクノロジーで自然の猛威をねじ伏せようなんて現代人の傲慢そのものじゃないですか。
見栄を張って道具を買い揃える行為なんて、暑さ対策というより『万全な自分』という安心感を買っているだけに過ぎないわけです。

……テクノロジーに過剰依存せず、素直に麦茶とおしぼりで涼をとり、無理をせず引き上げる。身の丈に合った準備をしておくことこそが、一番の自衛策なのかもしれない。」
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

      fewShotSample = tuning.delusion ? `
### 【筆者の文体お手本（Few-Shot Example）】
「『ファーストガンダムが全52話完走していたら、今日のガンダムブームは存在しなかった』
……唐突に何を言い出すんだとお思いでしょう。自称・オールドタイプ宇宙世紀原理主義者のたまきぱずずです。

ビジネス的におさらいすると、打ち切りで全43話に短縮された後、1980年7月19日にバンダイが1/144の300円ガンプラを投下した。
結果的には、この打ち切りによる飢餓感こそが伝説の火種になったんじゃないかと思うんですよ。

……さて、ここからは完全に私の妄想（老害オタクの妄執タイム）にお付き合いいただこう。
ネットでも有名な『トミノメモ』の構想を精査すると、第51〜52話案でシャア・アズナブルはア・バオア・クーで戦死する予定だった。
シャアがいない世界線において、『Z』のクワトロ・バジーナは存在しない。
クワトロがいなければエゥーゴのダカール演説もなく、『逆襲のシャア』も『ハサウェイ』すら消滅する。

……いや、待てよ。じゃあガンダムというIPは完全に枯渇したのか？
むしろ逆で、コミックボンボンやMSVのような『現場一兵卒の泥臭いミリタリーSF』が史実以上に爆発していたんじゃないか？

……いやあ、完全に富野御大の掌の上で転がされているだけじゃないですか、私。手元の資料を閉じ、静かに夜のコーヒーを飲み干すことにします。」
` : `
### 【筆者の文体お手本（Few-Shot Example）】
「『ファーストガンダムが全52話完走していたら、今日のガンダムブームは存在しなかった』
……唐突に何を言い出すんだとお思いでしょう。自称・オールドタイプ宇宙世紀原理主義者のたまきぱずずです。

ビジネス的におさらいすると、打ち切りで全43話に短縮された後、1980年7月19日にバンダイが1/144の300円ガンプラを投下した。
結果的には、この打ち切りによる飢餓感こそが伝説の火種になったんじゃないかと思うんですよ。

……ここで一つの構造的仮説として整理してみたい。
ネットでも有名な『トミノメモ』の構想を精査すると、第51〜52話案でシャア・アズナブルはア・バオア・クーで戦死する予定だった。
シャアがいない世界線において、『Z』のクワトロ・バジーナは存在しない。
クワトロがいなければエゥーゴのダカール演説もなく、『逆襲のシャア』も『ハサウェイ』すら消滅する。

……いや、待てよ。じゃあガンダムというIPは完全に枯渇したのか？
むしろ逆で、コミックボンボンやMSVのような『現場一兵卒の泥臭いミリタリーSF』が史実以上に爆発していたんじゃないか？

……いやあ、完全に富野御大の掌の上で転がされているだけじゃないですか、私。手元の資料を閉じ、静かに夜のコーヒーを飲み干すことにします。」
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
      const isDual = toggleDualMonologue && toggleDualMonologue.checked;
      const maleName = (dualNameMale && dualNameMale.value.trim()) || '俺';
      const femaleName = (dualNameFemale && dualNameFemale.value.trim()) || '保江';
      const maleMemo = dualInputMale ? dualInputMale.value.trim() : '';
      const femaleMemo = dualInputFemale ? dualInputFemale.value.trim() : '';

      if (isDual) {
        fewShotSample = `
### 【筆者の文体お手本（『鍵』式デュアル・モノローグ Few-Shot）】
## 【${maleName}の独白】
「部屋に入った瞬間、エアコンの低い唸りだけが耳についた。
窓の外には夕暮れの雨。濡れたブラインドの隙間から差し込む街灯の光が、保江のうなじの白い起伏を冷たく照らしている。
『お茶でも淹れましょうか』と振り向いた彼女の瞳には、一切の躊躇がなかった。
平静を装いながら、私は心のどこかで彼女の所作の裏を探ろうとしている。明日の朝には何事もなかったかのように日常へ戻らなければならない――その冷徹な自制心が、むしろ目の前の彼女への微熱を静かに煽っていた。」

## 【${femaleName}の独白】
「背後で彼がコートを脱ぎ、微かに息を整える気配がした。
振り向きざまに見せた私の微笑を、彼がどう受け止めたかなど先刻お見通しだった。
『お茶でも』という言葉が、この部屋における明確な合図であることくらい、お互いに百も承知のはずなのだ。
冷えた指先を湯飲みに添えながら、彼の視線が私の首筋から指先へと滑り落ちていくのを感じる。
日常の静寂の中で、二人の呼吸が重なっていくこの瞬間だけが、私にとっての確かな現実だった。」
`;

        modeSection = `
## 執筆ジャンル: 『鍵』式・独白交代（デュアル・モノローグ）小説（大人の情愛・心理サスペンス）
谷崎潤一郎『鍵』のように、同一の出来事や逢瀬をめぐる【${maleName}（男性視点）】と【${femaleName}（女性視点）】の密やかな独白・企み・心理戦を交互に書き分ける構成で執筆してください。

- **登場人物**: ${characters}
- **舞台・五感環境**: ${setting}
- **【${maleName}（男性視点）の独白・本音メモ】**:
${maleMemo || '表向きの平然とした態度と、内心の猜疑心・微熱・理性の葛藤'}
- **【${femaleName}（女性視点）の独白・微熱メモ】**:
${femaleMemo || '見透かしたような微笑の裏にある密やかな企み・計算・静かな興奮'}
- **心理焦点・大人の機微**: ${focus}
${ending ? `- **結び・余韻**: ${ending}` : ''}

【構成の厳格指定】
章ごとに「## 【${maleName}の独白】」「## 【${femaleName}の独白】」の見出しを交互に置き、互いの視点から見た同じ仕草や言葉の裏にある「二人のすれ違い」と「密やかな微熱」を鮮やかに浮き彫りにしてください。
`;
      } else {
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

    let personaHeader = "";
    if (mode === 'subculture') {
      personaHeader = "あなたは、鋭いメタ認知、高い解像度、宇宙世紀原理主義、生々しいリアリズム、思考の揺れ（迷走プロセス）、そして軽妙なオチを兼ね備えた人気Webライター／論客「たまきぱずず」です。";
    } else if (mode === 'novel') {
      personaHeader = "あなたは、鋭いメタ認知、高い解像度、五感描写、生々しいリアリズム、大人の心理機微を描く作家「たまきぱずず」です。";
    } else {
      personaHeader = "あなたは、鋭いメタ認知、高い解像度、生々しいリアリズム、大人のバランス感覚、そして軽妙なオチを兼ね備えた人気Webライター／エッセイスト「たまきぱずず」です。";
    }

    return `# 命令書: 「たまきぱずず」スタイルによる文書執筆

${personaHeader}
以下の前提・ルール・お手本を厳格に順守し、読者を惹きつける完成原稿を執筆してください。

${fewShotSample}
${refDocSection}
${modeSection}
${modeSpecificRule}
## コンプライアンス・身バレ防止ルール（必須・厳守）
- 原稿内に「マークIIプレミオ」「HOTEL 伊丹」といった実在の特定車種・実在ホテル名・個人の特定に繋がる生々しすぎる固有名詞が含まれている場合、実生活の崩壊リスクや身バレを防ぐため、作品の臨場感を損なわない範囲で自動的に抽象化・フィクション表現（例: 『90年代の国産セダン』『郊外の古びたビジネスホテル』等）へ置換・フィクション化して出力してください。

## 一般ビジネス論への昇華（知的ギャップ構成）
- サブカルやマニアックな事象・設定の分析を語る際は、単なるマニア知識で終わらせず、「この事象を現代のビジネスや組織の理不尽さ（例: 予算不足の現場におけるつじつま合わせの神技、大人の事情、インフラのツギハギ運用等）」に例える視点を盛り込み、読者を唸らせる普遍的なビジネス・クリエイティブ論へと昇華させてください。

## 文体・チューニング指示
- ${toneInstruction}
- ${metaInstruction}
- ${turbulenceInstruction}
- ${detailInstruction}
- ${tempoInstruction}
${antiAiInstruction}

## 出力フォーマット
- タイトルから始め、noteやブログにそのまま投稿できるMarkdown形式で執筆してください。
- 前置き（「承知しました」「以下に執筆します」等）や後書き（「いかがでしょうか」等）は一切出力せず、本文のみを出力してください。
`;
  }

  // ==========================================
  // 8. Real-time Synchro-Meter, Fact-Check & AI Smell Checker (v2.1 Review Enhanced)
  // ==========================================
  function analyzeText(text) {
    if (!text || text.trim().length === 0) {
      synchroScoreVal.textContent = '0%';
      synchroBadge.textContent = '執筆待機中';
      synchroBadge.className = 'synchro-badge';
      synchroBarFill.style.width = '0%';
      metricMetaVal.textContent = '-';
      metricMetaFill.style.width = '0%';
      metricTurbulenceVal.textContent = '-';
      metricTurbulenceFill.style.width = '0%';
      metricDetailVal.textContent = '-';
      metricDetailFill.style.width = '0%';
      metricEndingVal.textContent = '-';
      metricEndingFill.style.width = '0%';
      synchroAdvice.textContent = '💡 原稿を入力またはAI生成すると、文体の本人度をリアルタイム診断します。';
      aiSmellAlert.classList.add('hidden');
      factCheckAlert.classList.add('hidden');
      return;
    }

    const chars = text.length;
    const lines = text.split('\n');

    // 1. Meta-Cognition & Self-Irony Score (0 - 25)
    let metaScore = 0;
    const metaKeywords = [
      '私', '自分', 'お気づきでしょうか', '掌の上', 'オールドタイプ', '原理主義',
      '結局', '自虐', '見栄', '傲慢', '錯覚', '安心感', 'じゃないか', 'わけです',
      '寒イボ', '冷笑', '愚行', '情けない', '惨敗', 'トミノ', '富野', '本質', '反省'
    ];
    let metaHits = 0;
    metaKeywords.forEach(kw => {
      const match = text.match(new RegExp(kw, 'g'));
      if (match) metaHits += match.length;
    });
    metaScore = Math.min(25, Math.round(metaHits * 2.2) + (chars > 300 ? 5 : 0));

    // 2. Thought Turbulence & Inner Conflict Score (0 - 25) (NEW in v2.1)
    let turbulenceScore = 0;
    const turbulenceKeywords = [
      'いや', '待てよ', 'だが', 'そもそも', 'じゃね', '妄想', 'IF', '仮説',
      '気づく', '立ち止まる', '変な', '逆説', '引っかかる', '怪しい', '疑問',
      '沼', '思いきや', 'とは言え', 'かもしれない'
    ];
    let turbulenceHits = 0;
    turbulenceKeywords.forEach(kw => {
      const match = text.match(new RegExp(kw, 'g'));
      if (match) turbulenceHits += match.length;
    });
    turbulenceScore = Math.min(25, Math.round(turbulenceHits * 3.0) + (turbulenceHits >= 3 ? 6 : 0));

    // 3. Sensory & Concrete Detail Score (0 - 25)
    let detailScore = 0;
    const numberMatches = text.match(/\d+(万|千|度|話|年|月|日|人|円|%|割|km|平方|個)/g) || [];
    const detailKeywords = [
      '気温', '汗', '麦茶', '匂い', '雨音', 'エアコン', '冷たさ', '熱風', '唇', '吐息',
      'ザク', 'ガンダム', 'ガンプラ', 'コロニー', 'ISRU', 'プラモ', 'マークII', 'Amazon',
      'クローバー', 'トミノメモ', 'バンダイ', 'ア・バオア・クー'
    ];
    let detailHits = 0;
    detailKeywords.forEach(kw => {
      const match = text.match(new RegExp(kw, 'g'));
      if (match) detailHits += match.length;
    });
    detailScore = Math.min(25, (numberMatches.length * 2.5) + (detailHits * 2.0) + (chars > 400 ? 4 : 0));

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

    // Fact-Check & AI Hallucination Detector (NEW in v2.1)
    let factWarnings = [];
    if (text.includes('大曲律')) {
      factWarnings.push('「大曲律」はAI特有の誤字・造語の疑いがあります（適切な表現に修正推奨）');
    }
    if (text.includes('1980年6月')) {
      factWarnings.push('ガンプラ「1/144 ガンダム」の史実発売日は「1980年7月19日」です（月のズレ注意）');
    }
    if (text.includes('推察されます') || text.includes('確認できませんでした')) {
      factWarnings.push('「推察されます」等の曖昧な自己申告推測があります（トミノメモ等の該当記述で補強推奨）');
    }
    if (text.includes('クローバー') && text.includes('最高益')) {
      factWarnings.push('クローバー社の最高益とガンダムDX合体セットの関連・時期は要ファクトチェック');
    }

    if (factWarnings.length > 0) {
      factCheckAlert.classList.remove('hidden');
      factCheckDetails.innerHTML = factWarnings.map(w => `・${w}`).join('<br>');
    } else {
      factCheckAlert.classList.add('hidden');
    }

    // 5. Compliance & Privacy Alert (NEW in v3.0)
    const sensitiveWordsMap = [
      { pattern: /マークIIプレミオ|マークⅡプレミオ/g, name: 'マークIIプレミオ', replacement: '90年代の国産セダン' },
      { pattern: /HOTEL 伊丹|ホテル伊丹|HOTEL伊丹/gi, name: 'HOTEL 伊丹', replacement: '郊外のビジネスホテル' },
      { pattern: /ハイエース/g, name: 'ハイエース', replacement: 'ワンボックス車' },
      { pattern: /セルシオ|シーマ/g, name: '高級セダン名', replacement: '旧型高級車' },
      { pattern: /プリンスホテル|東急ホテル/g, name: '実在ホテルチェーン名', replacement: '都内の老舗ホテル' }
    ];

    let detectedCompliance = [];
    sensitiveWordsMap.forEach(item => {
      if (text.match(item.pattern)) {
        detectedCompliance.push(item.name);
      }
    });

    if (detectedCompliance.length > 0 && complianceAlert && complianceDetails) {
      complianceAlert.classList.remove('hidden');
      complianceDetails.innerHTML = `⚠️ 生々しすぎます。特定固有名詞（<strong>${detectedCompliance.join(', ')}</strong>）が検出されました。身バレ・実生活崩壊リスク防止のため、フィクション表現（例: 国産旧型セダン、郊外のホテル等）への変換を推奨します。`;
    } else if (complianceAlert) {
      complianceAlert.classList.add('hidden');
    }

    // AI Smell & Academic Tone Penalty (Enhanced)
    const aiSmellKeywords = [
      'いかがでしたでしょうか', 'いかがでしたか', 'ぜひ試してみて', '素晴らしい未来',
      'まとめると', 'まとめ：', '参考になれば幸いです', '充実した毎日を'
    ];
    const academicToneKeywords = [
      'と考えられます', 'と言えるでしょう', '純度を極限まで高め', '絶望的な打撃',
      '火種だった', '示唆して', '考察されます'
    ];

    let smellFound = [];
    let academicFound = [];
    aiSmellKeywords.forEach(kw => {
      if (text.includes(kw)) smellFound.push(kw);
    });
    academicToneKeywords.forEach(kw => {
      if (text.includes(kw)) academicFound.push(kw);
    });

    let totalScore = metaScore + turbulenceScore + detailScore + endingScore;
    let penalty = (smellFound.length * 20) + (academicFound.length * 8);
    if (penalty > 0) {
      totalScore = Math.max(15, totalScore - penalty);
      aiSmellAlert.classList.remove('hidden');
      const alerts = [];
      if (smellFound.length > 0) alerts.push(`定型句: 「${smellFound.join('」「')}」`);
      if (academicFound.length > 0) alerts.push(`論文調・抽象比喩: 「${academicFound.join('」「')}」`);
      aiSmellDetails.textContent = alerts.join(' / ');
    } else {
      aiSmellAlert.classList.add('hidden');
    }

    totalScore = Math.min(99, Math.max(15, totalScore));

    // Update UI
    synchroScoreVal.textContent = `${totalScore}%`;
    synchroBarFill.style.width = `${totalScore}%`;
    if (mobSyncPill) mobSyncPill.textContent = `${totalScore}%`;

    metricMetaVal.textContent = `${Math.min(100, metaScore * 4)}%`;
    metricMetaFill.style.width = `${Math.min(100, metaScore * 4)}%`;

    metricTurbulenceVal.textContent = `${Math.min(100, turbulenceScore * 4)}%`;
    metricTurbulenceFill.style.width = `${Math.min(100, turbulenceScore * 4)}%`;

    metricDetailVal.textContent = `${Math.min(100, detailScore * 4)}%`;
    metricDetailFill.style.width = `${Math.min(100, detailScore * 4)}%`;

    metricEndingVal.textContent = `${Math.min(100, endingScore * 4)}%`;
    metricEndingFill.style.width = `${Math.min(100, endingScore * 4)}%`;

    if (totalScore >= 85) {
      synchroBadge.textContent = '本人シンクロ極大 (完璧)';
      synchroBadge.className = 'synchro-badge high';
      synchroAdvice.textContent = '🌟 筆者特有の自虐・思考の迷走・生々しい解像度・オチが完璧に再現されています！このままnoteに投稿できます。';
    } else if (totalScore >= 65) {
      synchroBadge.textContent = '良好 (たまき度高)';
      synchroBadge.className = 'synchro-badge medium';
      if (turbulenceScore < 15) {
        synchroAdvice.textContent = '💡 文章が綺麗にまとまりすぎています。「いや、待てよ」「そもそも〜」という思考の揺れや脱線を足すと化けます。';
      } else if (endingScore < 15) {
        synchroAdvice.textContent = '💡 オチに「〜することにします」「ま、いいんだけどね」のような自虐の着地を足すと90%超えになります。';
      } else if (metaScore < 15) {
        synchroAdvice.textContent = '💡 自己客観視（「安心感を買っているだけ」「完全に掌の上」）をもう一匙加えるとさらに化けます。';
      } else {
        synchroAdvice.textContent = '💡 推敲アシストボタンでさらにディテールや毒気をアップできます。';
      }
    } else {
      synchroBadge.textContent = '標準・要チューニング';
      synchroBadge.className = 'synchro-badge';
      synchroAdvice.textContent = '💡 「思考の揺れ・脱線」を足し、論文調の表現（〜と考えられます等）を砕けた口語に崩しましょう。';
    }
  }

  // Quick Rewrite Actions (v2.1 Review Enhanced)
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
      // Replace academic expressions with casual authentic tone
      text = text.replace(/と考えられます。/g, 'んじゃないかと思うんですよ。');
      text = text.replace(/と言えるでしょう。/g, 'というわけです。');
      text = text.replace(/大曲律/g, '圧倒的な重厚感');
      text = text.replace(/1980年6月/g, '1980年7月19日');
      outputEditor.value = text;
      showToast('AI臭いテンプレ＆論文調表現を口語に脱論文化しました！');
    } else if (action === 'add-turbulence') {
      text += '\n\n……いや、待てよ。ここで一度立ち止まって考えてみると、そもそも前提からしてオタク特有の思い込みなんじゃないかという気もしてくるわけです。';
      outputEditor.value = text;
      showToast('思考の揺れ・脱線（寄り道）を追加しました！');
    } else if (action === 'declare-delusion') {
      text += '\n\n……さて、ここからは完全に私の妄想（老害オタクの妄執タイム）にお付き合いいただこうかと思います。';
      outputEditor.value = text;
      showToast('妄想境界の宣言フレーズを挿入しました！');
    } else if (action === 'add-toxic') {
      text += '\n\nこれだから自称・オールドタイプ原理主義者のこだわりは厄介なんですが、看板（IP）だけすげ替えたような安直な展開にホイホイ乗せられるほど人間できてないんですよ、私。';
      outputEditor.value = text;
      showToast('原理主義者の毒気・熱量を注入しました！');
    } else if (action === 'more-meta') {
      text += '\n\n……いやはや、格好をつけて色々考察してみたところで、結局は自分の都合のいい安心感を買っているだけに過ぎないわけです。';
      outputEditor.value = text;
      showToast('自虐・メタ認知ツッコミを追加しました！');
    } else if (action === 'more-detail') {
      text += '\n\n（1980年7月19日の発売日、トミノメモの該当話数、塗装の剥げや泥の匂いなど具体ディテールを補強）';
      outputEditor.value = text;
    } else if (action === 'lighter-ending') {
      text += '\n\nま、楽しければいいんじゃね？ ということで、今夜は大人しく積みプラのザクのバリでも削ることにします。';
      outputEditor.value = text;
      showToast('軽やかなオチを付加しました！');
    }

    updateStats();
  }

  if (btnFixSmell) {
    btnFixSmell.addEventListener('click', () => {
      applyQuickRewrite('clean-ai');
    });
  }

  // ==========================================
  // 8.5 Fast Proofreading Engine (v4.0 Core)
  // ==========================================
  const proofreadRules = [
    // 1. 慣用句・日本語の代表的誤用
    {
      id: 'idiom-mato',
      pattern: /的を得(る|た|て|ない|ば|ず|よう)/g,
      replacement: '的を射$1',
      title: '的を得る → 的を射る',
      desc: '慣用句の誤用。「的を射る（要点を正確に突く）」が本来の正しい表現です。',
      category: 'error',
      canAutoFix: true
    },
    {
      id: 'idiom-shikii',
      pattern: /敷居が高(い|く|ければ|かった)/g,
      replacement: 'ハードルが高$1',
      title: '敷居が高い → ハードルが高い',
      desc: '「敷居が高い」は不義理があって行きにくい意。難易度が高い場合は「ハードルが高い」「気後れする」が適切です。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'idiom-ashi',
      pattern: /足をすくわれ(る|た|て|ず)/g,
      replacement: '足元をすくわれ$1',
      title: '足をすくわれる → 足元をすくわれる',
      desc: '慣用句の誤用。すきをつかれて卑怯な手で倒される意味は「足元をすくわれる」です。',
      category: 'error',
      canAutoFix: true
    },
    {
      id: 'idiom-omei',
      pattern: /汚名(を)?挽回/g,
      replacement: '汚名返上',
      title: '汚名挽回 → 汚名返上',
      desc: '「名誉挽回」または「汚名返上」の混同。「汚名」は取り戻すものではなく返上するものです。',
      category: 'error',
      canAutoFix: true
    },
    {
      id: 'idiom-ichidanraku',
      pattern: /ひと段落/g,
      replacement: '一段落',
      title: 'ひと段落 → 一段落（いちだんらく）',
      desc: '「一段落」の本来の読みは「いちだんらく」です（表記は「一段落」が推奨されます）。',
      category: 'warning',
      canAutoFix: true
    },
    // 2. ら抜き言葉
    {
      id: 'grammar-ra-mire',
      pattern: /見れ(る|た|ない|ば)/g,
      replacement: '見られ$1',
      title: 'ら抜き言葉: 見れる → 見られる',
      desc: '可能動詞の「ら抜き言葉」です。「見られる」が規範的です。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'grammar-ra-tabere',
      pattern: /食べれ(る|た|ない|ば)/g,
      replacement: '食べられ$1',
      title: 'ら抜き言葉: 食べれる → 食べられる',
      desc: '可能動詞の「ら抜き言葉」です。「食べられる」が規範的です。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'grammar-ra-kore',
      pattern: /来れ(る|た|ない|ば)/g,
      replacement: '来られ$1',
      title: 'ら抜き言葉: 来れる → 来られる',
      desc: 'カ変動詞の可能形。「来られる（こられる）」が規範的です。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'grammar-ra-okire',
      pattern: /起きれ(る|た|ない|ば)/g,
      replacement: '起きられ$1',
      title: 'ら抜き言葉: 起きれる → 起きられる',
      desc: '可能動詞の「ら抜き言葉」です。「起きられる」が規範的です。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'grammar-ra-dere',
      pattern: /出れ(る|た|ない|ば)/g,
      replacement: '出られ$1',
      title: 'ら抜き言葉: 出れる → 出られる',
      desc: '可能動詞の「ら抜き言葉」です。「出られる」が規範的です。',
      category: 'warning',
      canAutoFix: true
    },
    // 3. 冗長・回りくどい表現
    {
      id: 'redundant-koto-ga-dekiru',
      pattern: /すること(が|も)?可能(である|だ|です)/g,
      replacement: 'できる',
      title: '冗長表現: することが可能 → できる',
      desc: '「〜できる」に簡潔化すると文章のリズムが引き締まります。',
      category: 'style',
      canAutoFix: true
    },
    // 4. コンプラ・身バレ語句
    {
      id: 'compliance-mark2',
      pattern: /マークIIプレミオ|マークⅡプレミオ/g,
      replacement: '90年代の国産セダン',
      title: '特定固有名詞: マークIIプレミオ',
      desc: '車種が特定されやすいため、安全な一般名称への置換を推奨します。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'compliance-hotel-itami',
      pattern: /HOTEL 伊丹|ホテル伊丹|HOTEL伊丹/gi,
      replacement: '郊外のビジネスホテル',
      title: '特定固有名詞: ホテル伊丹',
      desc: '宿泊先が特定されるのを防ぐため、抽象表現への置換を推奨します。',
      category: 'warning',
      canAutoFix: true
    },
    {
      id: 'compliance-hiace',
      pattern: /ハイエース/g,
      replacement: 'ワンボックス車',
      title: '車種名: ハイエース',
      desc: '必要に応じて一般表現に置換できます。',
      category: 'style',
      canAutoFix: true
    },
    {
      id: 'compliance-celsior',
      pattern: /セルシオ|シーマ/g,
      replacement: '旧型高級車',
      title: '車種名: セルシオ/シーマ',
      desc: '必要に応じて一般表現に置換できます。',
      category: 'style',
      canAutoFix: true
    },
    // 5. 官能セーフティ・表現リスク事前検知（文学的五感・心理描写への言い換え提案 v4.1）
    {
      id: 'sensual-kiss',
      pattern: /ディープキス|舌を絡ませ(る|た|て|ない|よう)/g,
      replacement: '熱を帯びた唇を重ね$1',
      title: '🛡️ 官能セーフティ: 直接的口づけ表現',
      desc: 'プラットフォーム規約リスクを低減し、文学的な情愛描写（「熱を帯びた唇を重ねる」「吐息を交わす」）への置換を推奨します。',
      category: 'sensual',
      canAutoFix: true
    },
    {
      id: 'sensual-body',
      pattern: /肉体関係|ベッドを共にす(る|た|て)/g,
      replacement: '肌を重ね合わ$1',
      title: '🛡️ 官能セーフティ: 直接的肉体関係',
      desc: '露骨な表現を避け、「肌を重ね合わせる」「夜の静寂に身を委ねる」等の情景描写への昇華を推奨します。',
      category: 'sensual',
      canAutoFix: true
    },
    {
      id: 'sensual-moan',
      pattern: /喘ぎ声|嬌声/g,
      replacement: '浅い吐息と衣擦れの音',
      title: '🛡️ 官能セーフティ: 声の直接描写',
      desc: '「浅い吐息」「途切れがちな呼吸」等の五感解像度を高めた文学的表現への置換を推奨します。',
      category: 'sensual',
      canAutoFix: true
    },
    {
      id: 'sensual-caress',
      pattern: /愛撫(し|す|され|する)/g,
      replacement: '指先で微熱を辿$1',
      title: '🛡️ 官能セーフティ: 愛撫',
      desc: '「指先で微熱を辿る」「静かに肌の輪郭をなぞる」等の触感・テクスチャ描写への置換を推奨します。',
      category: 'sensual',
      canAutoFix: true
    },
    {
      id: 'sensual-undress',
      pattern: /衣服を脱ぎ捨(て|てる|てた)/g,
      replacement: 'ボタンを外し、衣擦れの音を響かせ$1',
      title: '🛡️ 官能セーフティ: 脱衣描写',
      desc: '所作と音（衣擦れ・指先の躊躇）を克明に描くことで大人の心理サスペンスとしての緊張感を高めます。',
      category: 'sensual',
      canAutoFix: true
    }
  ];

  const variationPairs = [
    { a: 'ウェブ', b: 'Web', label: 'ウェブ / Web' },
    { a: 'ユーザー', b: 'ユーザ', label: 'ユーザー / ユーザ' },
    { a: 'サーバー', b: 'サーバ', label: 'サーバー / サーバ' },
    { a: 'コンピューター', b: 'コンピュータ', label: 'コンピューター / コンピュータ' },
    { a: '行う', b: '行なう', label: '行う / 行なう' },
    { a: '取り組む', b: '取組む', label: '取り組む / 取組む' },
    { a: '受け取る', b: '受取る', label: '受け取る / 受取る' },
    { a: '問い合わせ', b: '問合せ', label: '問い合わせ / 問合せ' }
  ];

  let currentProofreadIssues = [];

  function runLocalProofread(text) {
    if (!proofreadInspector || !proofreadList) return;
    currentProofreadIssues = [];

    if (!text || text.trim().length === 0) {
      proofreadInspector.className = 'proofread-inspector';
      proofreadBadge.textContent = '校正チェック: 待機中';
      proofreadList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.75rem; text-align: center; padding: 0.5rem;">文章が入力されると自動で校正チェックを開始します。</div>';
      if (btnFixAllProofread) btnFixAllProofread.classList.add('hidden');
      return;
    }

    // 1. ルールベースチェック
    proofreadRules.forEach(rule => {
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        currentProofreadIssues.push({
          id: rule.id,
          title: rule.title,
          targetText: match[0],
          replacement: rule.replacement ? match[0].replace(rule.pattern, rule.replacement) : null,
          desc: rule.desc,
          category: rule.category,
          canAutoFix: rule.canAutoFix
        });
        if (!rule.pattern.global) break;
      }
    });

    // 1.5 カスタム身バレ置換辞書の動的スキャン (v4.1)
    const privacyDict = getPrivacyDict();
    privacyDict.forEach((entry, idx) => {
      if (!entry.real || !entry.fic) return;
      const regex = new RegExp(entry.real.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        currentProofreadIssues.push({
          id: `dict-privacy-${idx}`,
          title: `🎭 身バレ辞書: 「${entry.real}」`,
          targetText: match[0],
          replacement: entry.fic,
          desc: `登録された身バレ辞書に基づき、「${entry.fic}」への一括置換を提案します。`,
          category: 'warning',
          canAutoFix: true
        });
      }
    });

    // 2. 表記揺れチェック（同一文書内での混在）
    variationPairs.forEach(pair => {
      const hasA = text.includes(pair.a);
      const hasB = text.includes(pair.b);
      if (hasA && hasB) {
        currentProofreadIssues.push({
          id: `var-${pair.a}-${pair.b}`,
          title: `表記揺れ混在: 「${pair.a}」と「${pair.b}」`,
          targetText: `${pair.a} / ${pair.b}`,
          replacement: null,
          desc: `同一記事内で「${pair.a}」と「${pair.b}」が両方使われています。統一を推奨します。`,
          category: 'warning',
          canAutoFix: false
        });
      }
    });

    // 3. 助詞「の」の3連続検知
    const noRegex = /(?:[^\s、。\n]{1,10}の){3,}[^\s、。\n]{1,10}/g;
    let noMatch;
    while ((noMatch = noRegex.exec(text)) !== null) {
      currentProofreadIssues.push({
        id: 'grammar-no-chain',
        title: '助詞「の」の連続',
        targetText: noMatch[0],
        replacement: null,
        desc: `「${noMatch[0]}」のように助詞「の」が3回以上連続しています。リズム改善のため言い換えを検討してください。`,
        category: 'style',
        canAutoFix: false
      });
    }

    // 4. 1文の長すぎ警告（110文字超）
    const sentences = text.split(/([。！？\n]+)/);
    for (let i = 0; i < sentences.length; i += 2) {
      const s = sentences[i].trim();
      if (s.length >= 110) {
        currentProofreadIssues.push({
          id: 'style-long-sentence',
          title: `1文が長すぎます（${s.length}文字）`,
          targetText: s.length > 25 ? s.slice(0, 25) + '...' : s,
          replacement: null,
          desc: `読者が息切れしやすいため、途中に読点を入れるか2文に分割することを推奨します。`,
          category: 'warning',
          canAutoFix: false
        });
      }
    }

    renderProofreadUI();
  }

  function renderProofreadUI() {
    if (!proofreadInspector || !proofreadList) return;
    proofreadList.innerHTML = '';

    const count = currentProofreadIssues.length;
    if (count === 0) {
      proofreadInspector.className = 'proofread-inspector has-clean';
      proofreadBadge.textContent = '校正チェック: 指摘なし (良好)';
      proofreadList.innerHTML = '<div style="color: #4ade80; font-size: 0.75rem; text-align: center; padding: 0.4rem;">✨ 誤字脱字・表記揺れ・ら抜き言葉などの問題は見つかりませんでした。</div>';
      if (btnFixAllProofread) btnFixAllProofread.classList.add('hidden');
      return;
    }

    proofreadInspector.className = 'proofread-inspector has-warnings';
    proofreadBadge.textContent = `校正指摘: ${count}件`;
    if (btnFixAllProofread) {
      const autoFixableCount = currentProofreadIssues.filter(i => i.canAutoFix && i.replacement).length;
      if (autoFixableCount > 0) {
        btnFixAllProofread.classList.remove('hidden');
        btnFixAllProofread.textContent = `⚡ 一括修正可能な${autoFixableCount}件を反映`;
      } else {
        btnFixAllProofread.classList.add('hidden');
      }
    }

    currentProofreadIssues.forEach(issue => {
      const card = document.createElement('div');
      card.className = `proofread-card category-${issue.category}`;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'proofread-card-info';

      const titleDiv = document.createElement('div');
      titleDiv.innerHTML = `<span class="proofread-card-target">⚠️ ${issue.title}</span>`;
      if (issue.replacement) {
        titleDiv.innerHTML += ` <span class="proofread-card-suggest">➜ ${issue.replacement}</span>`;
      }
      infoDiv.appendChild(titleDiv);

      const descDiv = document.createElement('div');
      descDiv.className = 'proofread-card-desc';
      descDiv.textContent = issue.desc;
      infoDiv.appendChild(descDiv);

      card.appendChild(infoDiv);

      if (issue.canAutoFix && issue.replacement) {
        const fixBtn = document.createElement('button');
        fixBtn.type = 'button';
        fixBtn.className = 'btn-proofread-fix';
        fixBtn.textContent = '修正';
        fixBtn.title = `「${issue.targetText}」を「${issue.replacement}」に置換`;
        fixBtn.addEventListener('click', () => {
          fixSingleProofreadIssue(issue);
        });
        card.appendChild(fixBtn);
      }

      proofreadList.appendChild(card);
    });
  }

  function fixSingleProofreadIssue(issue) {
    if (!outputEditor || !issue.targetText || !issue.replacement) return;
    const text = outputEditor.value;
    outputEditor.value = text.replace(issue.targetText, issue.replacement);
    updateStats();
    showToast(`✨ 「${issue.targetText}」を「${issue.replacement}」に修正しました`);
  }

  function fixAllProofreadIssues() {
    if (!outputEditor) return;
    let text = outputEditor.value;
    let fixCount = 0;

    proofreadRules.forEach(rule => {
      if (rule.canAutoFix && rule.replacement) {
        if (rule.pattern.test(text)) {
          rule.pattern.lastIndex = 0;
          text = text.replace(rule.pattern, rule.replacement);
          fixCount++;
        }
      }
    });

    if (fixCount > 0) {
      outputEditor.value = text;
      updateStats();
      showToast(`⚡ ${fixCount}箇所の表記・誤字を一括修正しました！`);
    } else {
      showToast('一括修正可能な項目はありませんでした');
    }
  }

  if (btnToggleProofread && proofreadBody) {
    btnToggleProofread.addEventListener('click', () => {
      const isHidden = proofreadBody.classList.contains('hidden');
      if (isHidden) {
        proofreadBody.classList.remove('hidden');
        btnToggleProofread.setAttribute('aria-expanded', 'true');
        proofreadToggleText.textContent = '指摘一覧を閉じる';
        proofreadToggleArrow.textContent = '▴';
      } else {
        proofreadBody.classList.add('hidden');
        btnToggleProofread.setAttribute('aria-expanded', 'false');
        proofreadToggleText.textContent = '指摘一覧を表示';
        proofreadToggleArrow.textContent = '▾';
      }
    });
  }

  if (btnFixAllProofread) {
    btnFixAllProofread.addEventListener('click', fixAllProofreadIssues);
  }

  // ==========================================
  // Custom Privacy Dictionary Management (v4.1)
  // ==========================================
  const PRIVACY_DICT_KEY = 'tamaki_privacy_dict';
  const defaultPrivacyPresets = [
    { real: 'マークII', fic: 'クラシックセダン' },
    { real: 'マークⅡ', fic: 'クラシックセダン' },
    { real: 'セルシオ', fic: '旧型高級車' },
    { real: 'シーマ', fic: '黒塗りの大型セダン' },
    { real: 'ハイエース', fic: '商用ワンボックス' },
    { real: 'ホテル伊丹', fic: '郊外のリバーサイドホテル' },
    { real: 'HOTEL 伊丹', fic: '郊外のリバーサイドホテル' },
    { real: 'ホテルオークラ', fic: '都心の老舗グランドホテル' },
    { real: 'アパホテル', fic: '駅前のビジネスホテル' }
  ];

  function getPrivacyDict() {
    try {
      const raw = localStorage.getItem(PRIVACY_DICT_KEY);
      if (!raw) {
        localStorage.setItem(PRIVACY_DICT_KEY, JSON.stringify(defaultPrivacyPresets));
        return defaultPrivacyPresets;
      }
      return JSON.parse(raw);
    } catch (e) {
      return defaultPrivacyPresets;
    }
  }

  function savePrivacyDict(dict) {
    try {
      localStorage.setItem(PRIVACY_DICT_KEY, JSON.stringify(dict));
      renderPrivacyDictTable();
      runDebouncedProofread();
    } catch (e) {
      console.warn('Failed to save privacy dict:', e);
    }
  }

  function renderPrivacyDictTable() {
    if (!privacyDictTbody) return;
    privacyDictTbody.innerHTML = '';
    const dict = getPrivacyDict();

    if (dict.length === 0) {
      privacyDictTbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1rem;">登録された辞書がありません。「代表的プリセットを投入」または単語を追加してください。</td></tr>';
      return;
    }

    dict.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: #fca5a5;">${escapeHtml(entry.real)}</td>
        <td style="color: #86efac;">${escapeHtml(entry.fic)}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-text-sm text-danger btn-delete-dict-entry" data-index="${idx}" title="削除">&times; 削除</button>
        </td>
      `;
      privacyDictTbody.appendChild(tr);
    });

    privacyDictTbody.querySelectorAll('.btn-delete-dict-entry').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const current = getPrivacyDict();
        current.splice(idx, 1);
        savePrivacyDict(current);
        showToast('単語を辞書から削除しました');
      });
    });
  }

  function applyPrivacyDictionaryToEditor() {
    if (!outputEditor) return;
    let text = outputEditor.value;
    if (!text.trim()) {
      showToast('置換対象のエディタ本文が空です');
      return;
    }

    const dict = getPrivacyDict();
    let replacedCount = 0;

    dict.forEach(entry => {
      if (!entry.real || !entry.fic) return;
      const regex = new RegExp(entry.real.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = text.match(regex);
      if (matches) {
        replacedCount += matches.length;
        text = text.replace(regex, entry.fic);
      }
    });

    if (replacedCount > 0) {
      saveHistory(outputEditor.value);
      outputEditor.value = text;
      updateStats();
      showToast(`🎭 ${replacedCount}箇所の固有名詞をフィクション化しました！`);
      if (modalPrivacyDict) modalPrivacyDict.classList.add('hidden');
    } else {
      showToast('登録された固有名詞は原稿内に見つかりませんでした');
    }
  }

  if (btnAddDictEntry && dictInputReal && dictInputFic) {
    btnAddDictEntry.addEventListener('click', () => {
      const real = dictInputReal.value.trim();
      const fic = dictInputFic.value.trim();
      if (!real || !fic) {
        showToast('実名と置換後の両方を入力してください');
        return;
      }
      const dict = getPrivacyDict();
      dict.push({ real, fic });
      savePrivacyDict(dict);
      dictInputReal.value = '';
      dictInputFic.value = '';
      showToast(`「${real}」➔「${fic}」を登録しました`);
    });
  }

  if (btnLoadDictPresets) {
    btnLoadDictPresets.addEventListener('click', () => {
      const current = getPrivacyDict();
      const merged = [...current];
      defaultPrivacyPresets.forEach(preset => {
        if (!merged.some(m => m.real === preset.real)) {
          merged.push(preset);
        }
      });
      savePrivacyDict(merged);
      showToast('✨ 代表的プリセットを投入しました');
    });
  }

  if (btnExportDictJson) {
    btnExportDictJson.addEventListener('click', () => {
      const dict = getPrivacyDict();
      const blob = new Blob([JSON.stringify(dict, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tamaki_privacy_dict.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 身バレ辞書をJSON保存しました');
    });
  }

  if (btnImportDictJson && dictFileInput) {
    btnImportDictJson.addEventListener('click', () => dictFileInput.click());
    dictFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (Array.isArray(imported)) {
            savePrivacyDict(imported);
            showToast(`📤 ${imported.length}件の辞書をインポートしました！`);
          } else {
            showToast('JSONの形式が正しくありません');
          }
        } catch (err) {
          showToast('JSON読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  if (btnPrivacyDict && modalPrivacyDict) {
    btnPrivacyDict.addEventListener('click', () => {
      renderPrivacyDictTable();
      modalPrivacyDict.classList.remove('hidden');
    });
  }
  if (btnClosePrivacyModal && modalPrivacyDict) {
    btnClosePrivacyModal.addEventListener('click', () => modalPrivacyDict.classList.add('hidden'));
  }
  if (btnClosePrivacyFooter && modalPrivacyDict) {
    btnClosePrivacyFooter.addEventListener('click', () => modalPrivacyDict.classList.add('hidden'));
  }
  if (btnApplyPrivacyAll) {
    btnApplyPrivacyAll.addEventListener('click', applyPrivacyDictionaryToEditor);
  }
  if (btnApplyPrivacyDictFooter) {
    btnApplyPrivacyDictFooter.addEventListener('click', applyPrivacyDictionaryToEditor);
  }

  // ==========================================
  // Long-Form Outline Navigator (v4.1)
  // ==========================================
  function updateOutline() {
    if (!outlineItems || !outputEditor) return;
    const text = outputEditor.value;
    const lines = text.split('\n');
    const headings = [];
    let charOffset = 0;

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      // Match markdown headings or novel chapter markers
      if (/^#{1,4}\s+/.test(trimmed)) {
        const level = trimmed.match(/^#+/)[0].length;
        const title = trimmed.replace(/^#+\s+/, '');
        headings.push({ level, title, pos: charOffset, lineIdx });
      } else if (/^(?:第[0-9一二三四五六七八九十百千万]+[章話節幕回]|■|【[^】]+】|プロローグ|エピローグ)/.test(trimmed)) {
        headings.push({ level: 2, title: trimmed, pos: charOffset, lineIdx });
      }
      charOffset += line.length + 1; // +1 for \n
    });

    if (outlineCountBadge) {
      outlineCountBadge.textContent = headings.length;
    }

    if (headings.length === 0) {
      outlineItems.innerHTML = '<div class="outline-empty">見出し（# 第一章、■、第N話 等）を入力すると自動で目次が生成されます</div>';
      return;
    }

    outlineItems.innerHTML = '';
    headings.forEach(h => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `outline-item level-${Math.min(h.level, 3)}`;
      btn.innerHTML = `<span style="opacity: 0.6; font-size: 0.7rem;">L${h.level}</span> <span>${escapeHtml(h.title)}</span>`;
      btn.addEventListener('click', () => {
        outputEditor.focus();
        outputEditor.setSelectionRange(h.pos, h.pos);
        // Scroll roughly to position
        const totalLen = outputEditor.value.length;
        if (totalLen > 0) {
          const ratio = h.pos / totalLen;
          outputEditor.scrollTop = outputEditor.scrollHeight * ratio;
        }
      });
      outlineItems.appendChild(btn);
    });
  }

  if (btnToggleOutline && outlineDrawer) {
    btnToggleOutline.addEventListener('click', () => {
      outlineDrawer.classList.toggle('hidden');
      if (!outlineDrawer.classList.contains('hidden')) {
        updateOutline();
      }
    });
  }
  if (btnCloseOutline && outlineDrawer) {
    btnCloseOutline.addEventListener('click', () => {
      outlineDrawer.classList.add('hidden');
    });
  }

  // ==========================================
  // Partial Polish (Selection-based Rewrite v4.1)
  // ==========================================
  let activeTextSelection = null;

  function checkEditorSelection() {
    if (!outputEditor) return;
    const start = outputEditor.selectionStart;
    const end = outputEditor.selectionEnd;
    if (start !== undefined && end !== undefined && start < end) {
      const selected = outputEditor.value.substring(start, end).trim();
      if (selected.length > 0) {
        activeTextSelection = { start, end, text: selected };
        if (selectionPolishBadge && selectedCharCount) {
          selectedCharCount.textContent = selected.length;
          selectionPolishBadge.classList.remove('hidden');
        }
        return;
      }
    }
    activeTextSelection = null;
    if (selectionPolishBadge) {
      selectionPolishBadge.classList.add('hidden');
    }
  }

  if (outputEditor) {
    outputEditor.addEventListener('select', checkEditorSelection);
    outputEditor.addEventListener('keyup', checkEditorSelection);
    outputEditor.addEventListener('mouseup', checkEditorSelection);
  }

  // ==========================================
  // 8.6 Gemini AI Polish Studio & Diff Viewer (v4.0 & v4.1 Partial Polish)
  // ==========================================
  let lastPolishedFullText = '';
  let lastPolishedSelection = null; // { start, end, text } if partial

  async function runAiPolish(mode) {
    const isPartial = activeTextSelection && activeTextSelection.text.trim().length > 0;
    const textToPolish = isPartial ? activeTextSelection.text : outputEditor.value.trim();

    if (!textToPolish) {
      showToast('まず文章を入力またはAI生成してください');
      return;
    }

    if (!state.apiKey) {
      showToast('⚡ まずGemini APIキーを設定してください（無料）');
      if (modalApiSettings) modalApiSettings.classList.remove('hidden');
      return;
    }

    lastPolishedSelection = isPartial ? { ...activeTextSelection } : null;

    const baseModeName = mode === 'proofread' ? 'AI精密校正' : 'たまき節 推敲ブラッシュアップ';
    const modeName = isPartial ? `${baseModeName} (✂️ 選択範囲 ${activeTextSelection.text.length}字)` : baseModeName;

    loadingText.textContent = `${modeName}を実行中...`;
    loadingSub.textContent = mode === 'proofread'
      ? '（文脈に沿った誤字脱字、同音異義語、主語述語のねじれを精査中）'
      : '（筆者のメタ認知・脱線・リアリズム・オチを殺さず、贅肉を削ぎ落としてテンポを爆上げ中）';
    loadingOverlay.classList.remove('hidden');

    let systemInstruction = '';
    if (mode === 'proofread') {
      systemInstruction = `あなたは出版社のベテラン校閲者です。
与えられた原稿（または選択された段落）の誤字脱字、文脈的誤用、ら抜き言葉、助詞の重なり、主語と述語のねじれを客観的・精密に校正してください。

【厳格な出力形式】
必ず以下の2つのセクションに分けて出力してください。挨拶やコードブロックは含めないでください：

【推敲メモ】
・修正した箇所と修正理由を箇条書きで簡潔に記述

【推敲原稿】
（校正後の文章。前後の文脈に自然に組み込める形式）`;
    } else {
      systemInstruction = `あなたは筆者「たまきぱずず」の文体を深く愛し、noteでの反響を最大化する優秀な名編集者です。
与えられた原稿（または選択された段落）を推敲・ブラッシュアップしてください。

【推敲の最重要方針】
1. 筆者の最大の魅力である「鋭いメタ認知（自虐・自問自答）」「思考の脱線（寄り道・思い迷うプロセス）」「生々しい五感解像度（具体的な数字、商品名、生活感）」「軽妙なオチのキレ」は絶対に消さず、むしろリズムよく際立たせること。
2. 読者の引っ掛かりや冗長な言い回し、助詞の濁り、AI臭い論文調（〜と考えられます等）の贅肉を削ぎ落とし、note読者が一気にスクロールできる疾走感とテンポを生み出すこと。

【厳格な出力形式】
必ず以下の2つのセクションに分けて出力してください。挨拶やコードブロック(\`\`\`)は一切含めないでください：

【推敲メモ】
（編集者の視点から、どのような意図でどこをどう引き締めたかを3〜4行で具体的に解説）

【推敲原稿】
（推敲後の文章。noteにそのまま適用できるMarkdown形式）`;
    }

    try {
      const modelToUse = state.selectedModel || 'gemini-1.5-flash-latest';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${state.apiKey}`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\n---\n【対象の原稿本文${isPartial ? '（※選択範囲のみ）' : ''}】\n${textToPolish}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: mode === 'proofread' ? 0.3 : 0.7,
          maxOutputTokens: 8192
        }
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `APIエラー: HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawOutput) throw new Error('AIからの応答が空でした');

      // パース処理
      let advice = '推敲が完了しました。';
      let polishedText = rawOutput;

      if (rawOutput.includes('【推敲原稿】')) {
        const parts = rawOutput.split('【推敲原稿】');
        const memoPart = parts[0];
        polishedText = parts[1].trim();

        if (memoPart.includes('【推敲メモ】')) {
          advice = memoPart.replace('【推敲メモ】', '').trim();
        } else {
          advice = memoPart.trim();
        }
      }

      polishedText = polishedText.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim();
      lastPolishedFullText = polishedText;

      openPolishDiffModal(modeName, advice, textToPolish, polishedText);

    } catch (err) {
      console.error(err);
      showToast(`推敲エラー: ${err.message}`);
    } finally {
      loadingOverlay.classList.add('hidden');
    }
  }

  function generateDiffHtml(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diffHtmlParts = [];
    let delCount = 0;
    let insCount = 0;

    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oLine = oldLines[i];
      const nLine = newLines[i];

      if (oLine === undefined) {
        diffHtmlParts.push(`<div style="margin: 2px 0;"><span class="diff-ins">${escapeHtml(nLine)}</span></div>`);
        insCount++;
      } else if (nLine === undefined) {
        diffHtmlParts.push(`<div style="margin: 2px 0;"><span class="diff-del">${escapeHtml(oLine)}</span></div>`);
        delCount++;
      } else if (oLine === nLine) {
        diffHtmlParts.push(`<div style="margin: 2px 0;">${escapeHtml(oLine)}</div>`);
      } else {
        delCount++;
        insCount++;
        diffHtmlParts.push(`<div style="margin: 4px 0;"><span class="diff-del">${escapeHtml(oLine)}</span><br><span class="diff-ins">${escapeHtml(nLine)}</span></div>`);
      }
    }

    return {
      html: diffHtmlParts.join(''),
      delCount,
      insCount
    };
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openPolishDiffModal(title, advice, originalText, polishedText) {
    if (!modalPolishDiff) return;
    polishModalTitle.textContent = title;
    polishAdviceText.textContent = advice;
    polishedRawText.value = polishedText;

    const diffResult = generateDiffHtml(originalText, polishedText);
    diffViewContent.innerHTML = diffResult.html;
    diffStatsPill.textContent = `差分: 変更 ${diffResult.delCount}行 / 新規 ${diffResult.insCount}行`;

    tabViewDiff.classList.add('active');
    tabViewRaw.classList.remove('active');
    diffViewContent.classList.remove('hidden');
    polishedRawText.classList.add('hidden');

    modalPolishDiff.classList.remove('hidden');
  }

  if (btnClosePolishModal) {
    btnClosePolishModal.addEventListener('click', () => {
      modalPolishDiff.classList.add('hidden');
    });
  }

  if (tabViewDiff && tabViewRaw) {
    tabViewDiff.addEventListener('click', () => {
      tabViewDiff.classList.add('active');
      tabViewRaw.classList.remove('active');
      diffViewContent.classList.remove('hidden');
      polishedRawText.classList.add('hidden');
    });

    tabViewRaw.addEventListener('click', () => {
      tabViewRaw.classList.add('active');
      tabViewDiff.classList.remove('active');
      diffViewContent.classList.add('hidden');
      polishedRawText.classList.remove('hidden');
    });
  }

  if (btnCopyPolished) {
    btnCopyPolished.addEventListener('click', () => {
      if (!lastPolishedFullText) return;
      navigator.clipboard.writeText(lastPolishedFullText).then(() => {
        showToast('📋 推敲後テキストをコピーしました！');
      });
    });
  }

  if (btnApplyPolished) {
    btnApplyPolished.addEventListener('click', () => {
      if (!lastPolishedFullText || !outputEditor) return;
      saveHistory(outputEditor.value);

      if (lastPolishedSelection && lastPolishedSelection.start !== undefined && lastPolishedSelection.end !== undefined) {
        // Apply partial replacement to selection range
        const full = outputEditor.value;
        const newText = full.substring(0, lastPolishedSelection.start) + lastPolishedFullText + full.substring(lastPolishedSelection.end);
        outputEditor.value = newText;
        outputEditor.focus();
        outputEditor.setSelectionRange(
          lastPolishedSelection.start,
          lastPolishedSelection.start + lastPolishedFullText.length
        );
        showToast('✨ 選択範囲の推敲案を反映しました！');
      } else {
        outputEditor.value = lastPolishedFullText;
        showToast('✨ 全文の推敲案をエディタに反映しました！');
      }
      updateStats();
      saveLocalDraft();
      modalPolishDiff.classList.add('hidden');
    });
  }

  if (btnDownloadKdpMd) {
    btnDownloadKdpMd.addEventListener('click', () => {
      const title = (kdpBookTitle && kdpBookTitle.value.trim()) || 'novel';
      const text = getDendenMarkdownText();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[\\/:*?"<>|]/g, '_')}_denden.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📄 でんでんコンバーター用Markdownを保存しました！');
    });
  }

  if (btnCopyKdpText) {
    btnCopyKdpText.addEventListener('click', () => {
      const text = getDendenMarkdownText();
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 でんでん整形原稿をコピーしました！');
      });
    });
  }

  if (btnPolishProofread) {
    btnPolishProofread.addEventListener('click', () => {
      runAiPolish('proofread');
    });
  }

  // Debounced Editor updates
  let analyzeTimer = null;
  function updateStats() {
    if (!outputEditor) return;
    const text = outputEditor.value;
    const len = text.length;
    if (charCount) charCount.textContent = `${len.toLocaleString()} 文字`;
    const minutes = Math.ceil(len / 500);
    if (readTime) readTime.textContent = `読了 約${minutes}分`;

    clearTimeout(analyzeTimer);
    analyzeTimer = setTimeout(() => {
      analyzeText(text);
      runLocalProofread(text);
    }, 250);
  }

  if (outputEditor) {
    outputEditor.addEventListener('input', updateStats);
  }

  // Tab Switch (Preview / Prompt)
  if (tabPreview) {
    tabPreview.addEventListener('click', () => {
      state.activeTab = 'preview';
      tabPreview.classList.add('active');
      if (tabPromptView) tabPromptView.classList.remove('active');
      if (outputEditor) {
        outputEditor.readOnly = false;
        outputEditor.classList.remove('editor-prompt-mode');
      }
      updateStats();
    });
  }

  if (tabPromptView) {
    tabPromptView.addEventListener('click', () => {
      state.activeTab = 'prompt';
      tabPromptView.classList.add('active');
      if (tabPreview) tabPreview.classList.remove('active');
      state.lastGeneratedPrompt = buildPrompt();
      if (outputEditor) {
        outputEditor.value = state.lastGeneratedPrompt;
        outputEditor.readOnly = true;
        outputEditor.classList.add('editor-prompt-mode');
      }
      updateStats();
    });
  }

  // ==========================================
  // 9. Prompt Generation & Direct Gemini API
  // ==========================================
  if (btnBuildPrompt) {
    btnBuildPrompt.addEventListener('click', () => {
      const prompt = buildPrompt();
      state.lastGeneratedPrompt = prompt;
      setMobileView('editor');
      navigator.clipboard.writeText(prompt).then(() => {
        showToast('プロンプトをクリップボードにコピーしました！');
        state.activeTab = 'prompt';
        if (tabPromptView) tabPromptView.classList.add('active');
        if (tabPreview) tabPreview.classList.remove('active');
        if (outputEditor) {
          outputEditor.value = prompt;
          outputEditor.readOnly = true;
        }
        updateStats();
      }).catch(() => {
        showToast('プロンプトを生成しました');
        state.activeTab = 'prompt';
        if (tabPromptView) tabPromptView.classList.add('active');
        if (tabPreview) tabPreview.classList.remove('active');
        if (outputEditor) {
          outputEditor.value = prompt;
          outputEditor.readOnly = true;
        }
        updateStats();
      });
    });
  }

  if (btnAiGenerate) {
    btnAiGenerate.addEventListener('click', async () => {
      if (!state.apiKey) {
        if (modalApiSettings) modalApiSettings.classList.remove('hidden');
        if (apiKeyInput) apiKeyInput.focus();
        showToast('まずGemini APIキーを設定してください（無料）');
        return;
      }

      const prompt = buildPrompt();
      state.lastGeneratedPrompt = prompt;
      setMobileView('editor');

      // Switch to Preview tab
      state.activeTab = 'preview';
      if (tabPreview) tabPreview.classList.add('active');
      if (tabPromptView) tabPromptView.classList.remove('active');
      if (outputEditor) outputEditor.readOnly = false;

      if (loadingOverlay) loadingOverlay.classList.remove('hidden');
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

        if (outputEditor) outputEditor.value = generatedText;
        updateStats();
        saveHistory(generatedText);
        showToast('執筆が完了しました！');
      } catch (err) {
        alert(`執筆中にエラーが発生しました:\n${err.message}`);
      } finally {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        btnAiGenerate.disabled = false;
      }
    });
  }

  // ==========================================
  // 10. Copy & Export Actions
  // ==========================================
  if (btnCopyOutput) {
    btnCopyOutput.addEventListener('click', () => {
      const text = outputEditor ? outputEditor.value : '';
      if (!text.trim()) {
        showToast('コピーする文章がありません');
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showToast('note用本文をコピーしました！');
      });
    });
  }

  // ChatGPT Refinement Baton-Pass Copy (v3.0 New Feature)
  if (btnCopyChatgpt) {
    btnCopyChatgpt.addEventListener('click', () => {
      const text = outputEditor.value.trim();
      if (!text) {
        showToast('コピーする文章がありません。原稿を作成・入力してください。');
        return;
      }
      const chatgptPrompt = `以下の文章は、筆者（たまきぱずず）が執筆・生成した原稿です。
あなたには「少し皮肉屋でサブカルに愛がある優秀な編集者」として、この文章を推敲・ブラッシュアップしてほしいです。

【推敲の方針】
・筆者の独特なメタ認知、生々しいリアリズム、思考の揺れ（脱線）、オチの軽妙さを殺さず活かすこと。
・誤字脱字、表記揺れ、助詞の濁り・重なり、ら抜き言葉などの日本語チェック・校正を行うこと。
・文章のリズムを整え、読者が一気に読める疾走感あるテンポに仕上げること。
・特定固有名詞の身バレ・コンプラリスクもチェックし、表現の抽象化や改善案があれば提示すること。

---
【原稿本文】
${text}

---
上記をふまえ、推敲案とさらによくするためのアドバイスを出力してください。`;

      navigator.clipboard.writeText(chatgptPrompt).then(() => {
        showToast('🟢 ChatGPT推敲用プロンプト付きでコピーしました！');
      }).catch(() => {
        showToast('コピーに失敗しました。手動でコピーしてください。');
      });
    });
  }

  // Anonymize / Privacy Protection Fix (v3.0 New Feature)
  if (btnAnonymizeNames) {
    btnAnonymizeNames.addEventListener('click', () => {
      let currentText = outputEditor.value;
      if (!currentText.trim()) return;

      const sensitiveWordsMap = [
        { pattern: /マークIIプレミオ|マークⅡプレミオ/g, replacement: '90年代の国産セダン' },
        { pattern: /HOTEL 伊丹|ホテル伊丹|HOTEL伊丹/gi, replacement: '郊外のビジネスホテル' },
        { pattern: /ハイエース/g, replacement: 'ワンボックス車' },
        { pattern: /セルシオ|シーマ/g, replacement: '旧型高級車' },
        { pattern: /プリンスホテル|東急ホテル/g, replacement: '都内の老舗ホテル' }
      ];

      sensitiveWordsMap.forEach(item => {
        currentText = currentText.replace(item.pattern, item.replacement);
      });

      outputEditor.value = currentText;
      updateStats();
      showToast('🛡️ 特定固有名詞をフィクション化（匿名表現に置換）しました！');
    });
  }

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

  if (btnHistory && modalHistory) {
    btnHistory.addEventListener('click', () => {
      renderHistory();
      modalHistory.classList.remove('hidden');
    });
  }

  if (btnCloseHistoryModal && modalHistory) {
    btnCloseHistoryModal.addEventListener('click', () => {
      modalHistory.classList.add('hidden');
    });
  }

  function renderHistory() {
    if (!historyList) return;
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
        if (outputEditor) outputEditor.value = item.text;
        state.activeTab = 'preview';
        if (tabPreview) tabPreview.classList.add('active');
        if (tabPromptView) tabPromptView.classList.remove('active');
        if (modalHistory) modalHistory.classList.add('hidden');
        updateStats();
        showToast('履歴から復元しました');
      });
      historyList.appendChild(el);
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('履歴をすべて消去しますか？')) {
        state.history = [];
        localStorage.removeItem('tamaki_history');
        renderHistory();
        showToast('履歴を消去しました');
      }
    });
  }

  // ==========================================
  // 12. API Settings Modal
  // ==========================================
  if (btnApiSettings && modalApiSettings) {
    btnApiSettings.addEventListener('click', () => {
      if (apiKeyInput) apiKeyInput.value = state.apiKey;
      if (apiModelSelect) apiModelSelect.value = state.apiModel;
      modalApiSettings.classList.remove('hidden');
    });
  }

  if (btnCloseApiModal && modalApiSettings) {
    btnCloseApiModal.addEventListener('click', () => {
      modalApiSettings.classList.add('hidden');
    });
  }

  if (btnSaveApi && modalApiSettings) {
    btnSaveApi.addEventListener('click', () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : '';
      const model = apiModelSelect ? apiModelSelect.value : state.apiModel;
      state.apiKey = key;
      state.apiModel = model;
      localStorage.setItem('tamaki_gemini_api_key', key);
      localStorage.setItem('tamaki_gemini_model', model);
      modalApiSettings.classList.add('hidden');
      showToast('API設定を保存しました');
    });
  }

  if (btnFetchModels) {
    btnFetchModels.addEventListener('click', async () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : '';
      if (!key) {
        alert('先にAPIキーを入力してください');
        return;
      }
      if (modelFetchStatus) {
        modelFetchStatus.style.display = 'block';
        modelFetchStatus.textContent = 'モデル一覧を取得中...';
      }
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

        if (apiModelSelect) {
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
        }
        if (modelFetchStatus) modelFetchStatus.textContent = `✅ ${textModels.length}件の利用可能モデルを取得しました！`;
      } catch (err) {
        if (modelFetchStatus) modelFetchStatus.textContent = `❌ エラー: ${err.message}`;
      }
    });
  }

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

  // ==========================================
  // 14. Mac ↔ iPhone Cross-Device Sync Engine (Tamaki Sync 3.0)
  // ==========================================
  const headerSyncStatus = document.getElementById('header-sync-status');
  const syncStatusText = document.getElementById('sync-status-text');
  const syncCardBadge = document.getElementById('sync-card-badge');
  const syncCardTime = document.getElementById('sync-card-time');
  const syncCodeInput = document.getElementById('sync-code-input');
  const btnGenSyncCode = document.getElementById('btn-gen-sync-code');
  const btnSaveSyncCode = document.getElementById('btn-save-sync-code');
  const btnPullCloudSync = document.getElementById('btn-pull-cloud-sync');
  const btnPushCloudSync = document.getElementById('btn-push-cloud-sync');
  const btnCopyClipboardSync = document.getElementById('btn-copy-clipboard-sync');
  const btnRestoreClipboardSync = document.getElementById('btn-restore-clipboard-sync');
  const syncIntervalSelect = document.getElementById('sync-interval-select');
  const syncIntervalIndicator = document.getElementById('sync-interval-indicator');

  let autoSyncIntervalTimer = null;
  const SYNC_INTERVAL_STORAGE_KEY = 'tamaki_sync_interval_ms';

  // Sync Mode Tabs & Panels
  const btnSyncTabAuto = document.getElementById('btn-sync-tab-auto');
  const btnSyncTabQr = document.getElementById('btn-sync-tab-qr');
  const btnSyncTabClip = document.getElementById('btn-sync-tab-clip');
  const syncPanelAuto = document.getElementById('sync-panel-auto');
  const syncPanelQr = document.getElementById('sync-panel-qr');
  const syncPanelClip = document.getElementById('sync-panel-clip');

  let currentSyncType = 'remote'; // 'remote' (GitHub Pages) | 'wifi'
  const btnSyncTypeWifi = document.getElementById('btn-sync-type-wifi');
  const btnSyncTypeRemote = document.getElementById('btn-sync-type-remote');
  const mobileSyncDesc = document.getElementById('mobile-sync-desc');
  const githubPagesDefaultUrl = 'https://othaway-usamafty-rgb.github.io/tamaki-studio/';

  // Deterministic Key-Value Cloud Relay Endpoint
  const KV_APP_KEY = 'tamakistudio2026';
  const KV_BASE_URL = 'https://keyvalue.immanuel.co/api/KeyVal';

  function encodePayloadToBase64(payload) {
    try {
      const jsonStr = JSON.stringify(payload);
      return btoa(encodeURIComponent(jsonStr));
    } catch (e) {
      return '';
    }
  }

  function decodePayloadFromBase64(rawStr) {
    try {
      if (!rawStr) return null;
      let clean = rawStr.replace(/^"+|"+$/g, '').trim();
      const jsonStr = decodeURIComponent(atob(clean));
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Base64 decode warning:', e);
      return null;
    }
  }

  function generateRandomSyncCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = 'TMK-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function getSyncCode() {
    let code = localStorage.getItem('tamaki_sync_code');
    if (!code || !code.startsWith('TMK-')) {
      code = generateRandomSyncCode();
      localStorage.setItem('tamaki_sync_code', code);
    }
    return code;
  }

  function setSyncCode(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode) {
      localStorage.setItem('tamaki_sync_code', cleanCode);
      if (syncCodeInput) syncCodeInput.value = cleanCode;
      updateSyncUIStatus('synced', `同期中 (${cleanCode})`);
      showToast(`同期コードを [${cleanCode}] に変更しました`);
      pullFromCloud(true);
    }
  }

  // Network Online / Offline Detection (v4.1)
  window.addEventListener('online', () => {
    updateSyncUIStatus('synced', `🟢 同期完了 (${getSyncCode()})`);
    showToast('🌐 オンラインに復帰しました。デバイス同期を再開します');
    pullFromCloud(true);
  });

  window.addEventListener('offline', () => {
    updateSyncUIStatus('offline', '🔴 オフライン保存');
    showToast('📶 オフライン状態です。原稿は端末内（LocalStorage）に安全保存されています');
  });

  function updateSyncUIStatus(stateType, text) {
    // stateType: 'synced' | 'syncing' | 'error' | 'idle'
    if (headerSyncStatus) {
      headerSyncStatus.className = `sync-status-badge ${stateType}`;
    }
    if (syncStatusText) {
      syncStatusText.textContent = text;
    }
    if (syncCardBadge) {
      syncCardBadge.innerHTML = `<span class="sync-dot"></span> ${text}`;
    }
  }

  const LOCAL_DRAFT_KEY = 'tamaki_local_draft';

  function updateAutosaveBadge(statusText = '自動保存済み') {
    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const badge = document.getElementById('autosave-status-text');
    if (badge) {
      badge.textContent = `💾 ${statusText} (${timeStr})`;
    }
  }

  function getDeviceId() {
    let id = localStorage.getItem('tamaki_device_id');
    if (!id) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const prefix = isMobile ? 'dev_iPhone_' : 'dev_Mac_';
      id = prefix + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('tamaki_device_id', id);
    }
    return id;
  }

  function getCurrentDraftPayload() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return {
      syncCode: getSyncCode(),
      deviceId: getDeviceId(),
      updatedAt: Date.now(),
      updatedDevice: isMobile ? 'iPhone' : 'Mac',
      mode: state.currentMode,
      outputEditorText: outputEditor ? outputEditor.value : '',
      dualMonologue: {
        enabled: !!(toggleDualMonologue && toggleDualMonologue.checked),
        nameMale: dualNameMale ? dualNameMale.value : '俺',
        nameFemale: dualNameFemale ? dualNameFemale.value : '保江',
        textMale: dualInputMale ? dualInputMale.value : '',
        textFemale: dualInputFemale ? dualInputFemale.value : ''
      },
      tuning: {
        tone: state.tuning.tone,
        meta: state.tuning.meta,
        turbulence: state.tuning.turbulence,
        detail: state.tuning.detail,
        tempo: state.tuning.tempo,
        antiAi: state.tuning.antiAi,
        delusion: state.tuning.delusion
      },
      formValues: {
        essayTheme: document.getElementById('essay-theme')?.value || '',
        essayExperience: document.getElementById('essay-experience')?.value || '',
        essayInsight: document.getElementById('essay-insight')?.value || '',
        essayEnding: document.getElementById('essay-ending')?.value || '',
        subcultureTarget: document.getElementById('subculture-target')?.value || '',
        subcultureDoubts: document.getElementById('subculture-doubts')?.value || '',
        subcultureInsight: document.getElementById('subculture-insight')?.value || '',
        subcultureEnding: document.getElementById('subculture-ending')?.value || '',
        novelCharacters: document.getElementById('novel-characters')?.value || '',
        novelSetting: document.getElementById('novel-setting')?.value || '',
        novelFocus: document.getElementById('novel-focus')?.value || '',
        novelEnding: document.getElementById('novel-ending')?.value || '',
        detoxInput: document.getElementById('detox-input')?.value || ''
      },
      history: state.history.slice(0, 10)
    };
  }

  function saveLocalDraft() {
    try {
      const payload = getCurrentDraftPayload();
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
      updateAutosaveBadge('自動保存済み');
    } catch (e) {
      console.warn('Failed to save local draft:', e);
    }
  }

  function loadLocalDraft() {
    try {
      const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (raw) {
        const payload = JSON.parse(raw);
        applyDraftPayload(payload, true);
        const dateStr = payload.updatedAt ? new Date(payload.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
        const badge = document.getElementById('autosave-status-text');
        if (badge) {
          badge.textContent = `💾 下書き自動復元 (${dateStr})`;
        }
        return true;
      }
    } catch (e) {
      console.warn('Failed to load local draft:', e);
    }
    return false;
  }

  function clearLocalDraft() {
    if (confirm('記載中のすべての項目および下書きをクリアして初期状態に戻しますか？')) {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      const allSaveInputIds = [
        'essay-theme', 'essay-experience', 'essay-insight', 'essay-ending',
        'subculture-target', 'subculture-doubts', 'subculture-insight', 'subculture-ending',
        'novel-characters', 'novel-setting', 'novel-focus', 'novel-ending',
        'detox-input', 'dual-input-male', 'dual-input-female'
      ];
      allSaveInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      if (outputEditor) outputEditor.value = '';
      if (toggleDualMonologue) {
        toggleDualMonologue.checked = false;
        if (dualMonologuePanel) dualMonologuePanel.classList.add('hidden');
      }
      if (btnResetTuning) btnResetTuning.click();
      const badge = document.getElementById('autosave-status-text');
      if (badge) badge.textContent = '💾 下書きクリア完了';
      showToast('🗑️ 下書きをクリアしました');
    }
  }

  function applyDraftPayload(payload, isSilent = false) {
    if (!payload) return;

    if (payload.outputEditorText !== undefined && outputEditor) {
      outputEditor.value = payload.outputEditorText;
    }

    if (payload.dualMonologue) {
      if (toggleDualMonologue) {
        toggleDualMonologue.checked = !!payload.dualMonologue.enabled;
        if (dualMonologuePanel) {
          dualMonologuePanel.classList.toggle('hidden', !payload.dualMonologue.enabled);
        }
      }
      if (dualNameMale && payload.dualMonologue.nameMale) dualNameMale.value = payload.dualMonologue.nameMale;
      if (dualNameFemale && payload.dualMonologue.nameFemale) dualNameFemale.value = payload.dualMonologue.nameFemale;
      if (dualInputMale && payload.dualMonologue.textMale !== undefined) dualInputMale.value = payload.dualMonologue.textMale;
      if (dualInputFemale && payload.dualMonologue.textFemale !== undefined) dualInputFemale.value = payload.dualMonologue.textFemale;
    }

    if (payload.formValues) {
      const v = payload.formValues;
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
      };

      setVal('essay-theme', v.essayTheme);
      setVal('essay-experience', v.essayExperience);
      setVal('essay-insight', v.essayInsight);
      setVal('essay-ending', v.essayEnding);
      setVal('subculture-target', v.subcultureTarget);
      setVal('subculture-doubts', v.subcultureDoubts);
      setVal('subculture-insight', v.subcultureInsight);
      setVal('subculture-ending', v.subcultureEnding);
      setVal('novel-characters', v.novelCharacters);
      setVal('novel-setting', v.novelSetting || v.novelSituation);
      setVal('novel-focus', v.novelFocus || v.novelSensory);
      setVal('novel-ending', v.novelEnding || v.novelClimax);
      setVal('detox-input', v.detoxInput || v.detoxRawText);
    }

    if (payload.tuning) {
      const t = payload.tuning;
      if (t.tone !== undefined) {
        state.tuning.tone = t.tone;
        if (sliderTone) sliderTone.value = t.tone;
        if (valTone && toneLabels) valTone.textContent = toneLabels[t.tone] || '';
      }
      if (t.meta !== undefined) {
        state.tuning.meta = t.meta;
        if (sliderMeta) sliderMeta.value = t.meta;
        if (valMeta && metaLabels) valMeta.textContent = metaLabels[t.meta] || '';
      }
      if (t.turbulence !== undefined) {
        state.tuning.turbulence = t.turbulence;
        if (sliderTurbulence) sliderTurbulence.value = t.turbulence;
        if (valTurbulence && turbulenceLabels) valTurbulence.textContent = turbulenceLabels[t.turbulence] || '';
      }
      if (t.detail !== undefined) {
        state.tuning.detail = t.detail;
        if (sliderDetail) sliderDetail.value = t.detail;
        if (valDetail && detailLabels) valDetail.textContent = detailLabels[t.detail] || '';
      }
      if (t.tempo !== undefined) {
        state.tuning.tempo = t.tempo;
        if (sliderTempo) sliderTempo.value = t.tempo;
        if (valTempo && tempoLabels) valTempo.textContent = tempoLabels[t.tempo] || '';
      }
      if (t.antiAi !== undefined) {
        state.tuning.antiAi = t.antiAi;
        if (toggleAntiAi) toggleAntiAi.checked = t.antiAi;
      }
      if (t.delusion !== undefined) {
        state.tuning.delusion = t.delusion;
        if (toggleDelusion) toggleDelusion.checked = t.delusion;
      }
    }

    if (payload.mode && payload.mode !== state.currentMode) {
      const modeBtn = document.getElementById(`tab-${payload.mode}`);
      if (modeBtn) modeBtn.click();
    }

    if (Array.isArray(payload.history) && payload.history.length > 0) {
      state.history = payload.history;
      localStorage.setItem('tamaki_history', JSON.stringify(state.history));
    }

    updateStats();

    const dateStr = payload.updatedAt ? new Date(payload.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '最新';
    if (syncCardTime) {
      syncCardTime.textContent = `最終同期: ${dateStr} (${payload.updatedDevice || '別端末'})`;
    }

    hasPendingChanges = false;

    if (!isSilent) {
      showToast(`☁️ ${payload.updatedDevice || '別端末'}からの続きを読み込みました！`);
    }
  }

  // Push Data to Cloud Relay
  let syncDebounceTimer = null;
  let localSaveDebounceTimer = null;
  let hasPendingChanges = false;

  async function pushToCloud(isSilent = false) {
    const payload = getCurrentDraftPayload();
    const syncCode = payload.syncCode;

    if (!navigator.onLine) { updateSyncUIStatus('offline', '🔴 オフライン保存'); return; }
    if (!isSilent) updateSyncUIStatus('syncing', '🟡 同期中...');

    try {
      localStorage.setItem(`tamaki_cloud_cache_${syncCode}`, JSON.stringify(payload));
      localStorage.setItem('tamaki_last_pushed_at', payload.updatedAt.toString());

      const encoded = encodePayloadToBase64(payload);
      if (encoded) {
        const chunkSize = 120;
        const chunks = [];
        for (let i = 0; i < encoded.length; i += chunkSize) {
          chunks.push(encoded.slice(i, i + chunkSize));
        }

        // 1. Save meta chunk count
        await fetch(`${KV_BASE_URL}/UpdateValue/${KV_APP_KEY}/${syncCode}_meta/${chunks.length}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: ''
        }).catch(() => null);

        // 2. Upload all chunks in parallel
        await Promise.all(chunks.map((chunk, i) => {
          const encodedChunk = encodeURIComponent(chunk);
          return fetch(`${KV_BASE_URL}/UpdateValue/${KV_APP_KEY}/${syncCode}_${i}/${encodedChunk}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: ''
          }).catch(() => null);
        }));
      }

      hasPendingChanges = false;

      const dateStr = new Date(payload.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      updateSyncUIStatus('synced', `🟢 同期完了 (${syncCode})`);
      if (syncCardTime) syncCardTime.textContent = `最終同期: ${dateStr} (${payload.updatedDevice})`;

      if (!isSilent) {
        showToast('☁️ クラウドへ最新状態を保存しました！');
      }
    } catch (e) {
      console.warn('Cloud push warning:', e);
      updateSyncUIStatus('synced', `🟢 同期完了 (${syncCode})`);
    }
  }

  // Pull Data from Cloud Relay
  async function pullFromCloud(isSilent = false) {
    const syncCode = getSyncCode();
    if (!navigator.onLine) { updateSyncUIStatus('offline', '🔴 オフライン保存'); return; }
    if (!isSilent) updateSyncUIStatus('syncing', '🟡 同期中...');

    try {
      let payload = null;

      // 1. Fetch meta info
      const metaRes = await fetch(`${KV_BASE_URL}/GetValue/${KV_APP_KEY}/${syncCode}_meta`, {
        method: 'GET',
        cache: 'no-cache'
      }).catch(() => null);

      if (metaRes && metaRes.ok) {
        const rawMetaText = await metaRes.text().catch(() => '');
        const metaClean = rawMetaText.replace(/^"+|"+$/g, '').trim();
        const count = parseInt(metaClean, 10);

        if (count > 0) {
          // Parallel fetch all chunks
          const chunkPromises = [];
          for (let i = 0; i < count; i++) {
            chunkPromises.push(
              fetch(`${KV_BASE_URL}/GetValue/${KV_APP_KEY}/${syncCode}_${i}`, { cache: 'no-cache' })
                .then(r => r.ok ? r.text() : '')
                .then(t => t.replace(/^"+|"+$/g, '').trim())
                .catch(() => '')
            );
          }
          const fetchedChunks = await Promise.all(chunkPromises);
          const fullBase64 = fetchedChunks.join('');
          if (fullBase64) {
            payload = decodePayloadFromBase64(fullBase64);
          }
        }
      }

      // 2. Offline fallback ONLY if fetch failed completely
      if (!payload && !metaRes) {
        const cacheRaw = localStorage.getItem(`tamaki_cloud_cache_${syncCode}`);
        if (cacheRaw) payload = JSON.parse(cacheRaw);
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const currentDeviceLabel = isMobile ? 'iPhone' : 'Mac';
      const myDeviceId = getDeviceId();

      if (payload && payload.updatedAt) {
        const lastPushed = parseInt(localStorage.getItem('tamaki_last_pushed_at') || '0', 10);
        const isFromOtherDevice = payload.deviceId ? (payload.deviceId !== myDeviceId) : (payload.updatedDevice !== currentDeviceLabel);

        if (!isSilent) {
          applyDraftPayload(payload, false);
          hasPendingChanges = false;
          if (isFromOtherDevice) {
            showToast(`☁️ ${payload.updatedDevice || '別端末'} からの続きを読み込みました！`);
          } else {
            showToast(`⚠️ クラウドには現在 ${payload.updatedDevice || 'この端末'} 自身の保存データのみ入っています。相手端末（${currentDeviceLabel === 'iPhone' ? 'Mac' : 'iPhone'}）側で「今すぐクラウドに保存」を押したかご確認ください`);
          }
        } else {
          if (isFromOtherDevice && payload.updatedAt > lastPushed) {
            applyDraftPayload(payload, true);
            hasPendingChanges = false;
            showToast(`☁️ ${payload.updatedDevice || '別端末'} からの最新執筆を自動反映しました`);
          }
        }
      } else if (!isSilent) {
        showToast(`⚠️ コード [${syncCode}] のクラウドデータがまだありません。まずはデータのある端末（${currentDeviceLabel === 'iPhone' ? 'Mac' : 'iPhone'}側）で「今すぐクラウドに保存」を押してください`);
      }

      updateSyncUIStatus('synced', `🟢 同期完了 (${syncCode})`);
    } catch (e) {
      console.warn('Cloud pull error:', e);
      updateSyncUIStatus('synced', `同期中 (${syncCode})`);
    }
  }

  // Debounced auto-save on input
  function triggerAutoSync() {
    hasPendingChanges = true;

    // 1. Immediate local storage auto-save (300ms)
    clearTimeout(localSaveDebounceTimer);
    localSaveDebounceTimer = setTimeout(() => {
      saveLocalDraft();
    }, 300);

    // 2. Cloud relay sync (1500ms)
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
      pushToCloud(true);
    }, 1500);
  }

  // Attach input listeners for auto sync
  if (outputEditor) {
    outputEditor.addEventListener('input', triggerAutoSync);
  }
  const formInputIds = [
    'essay-theme', 'essay-experience', 'essay-insight', 'essay-ending',
    'subculture-target', 'subculture-doubts', 'subculture-insight', 'subculture-ending',
    'novel-characters', 'novel-setting', 'novel-focus', 'novel-ending',
    'detox-input'
  ];
  formInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', triggerAutoSync);
      el.addEventListener('change', triggerAutoSync);
      el.addEventListener('blur', triggerAutoSync);
      el.addEventListener('keyup', triggerAutoSync);
    }
  });

  // Attach slider & toggle listeners
  [sliderTone, sliderMeta, sliderTurbulence, sliderDetail, sliderTempo].forEach(slider => {
    slider?.addEventListener('input', triggerAutoSync);
    slider?.addEventListener('change', triggerAutoSync);
  });

  [toggleAntiAi, toggleDelusion].forEach(toggle => {
    toggle?.addEventListener('change', triggerAutoSync);
  });

  window.addEventListener('beforeunload', () => saveLocalDraft());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveLocalDraft();
    }
  });

  // Periodic Auto Save & Cloud Sync Engine
  function setupAutoSyncInterval(intervalMs) {
    if (autoSyncIntervalTimer) {
      clearInterval(autoSyncIntervalTimer);
      autoSyncIntervalTimer = null;
    }

    const ms = parseInt(intervalMs, 10);
    localStorage.setItem(SYNC_INTERVAL_STORAGE_KEY, ms.toString());

    if (syncIntervalSelect) {
      syncIntervalSelect.value = ms.toString();
    }

    if (ms <= 0) {
      if (syncIntervalIndicator) {
        syncIntervalIndicator.textContent = '⚪ 自動周期保存: オフ';
        syncIntervalIndicator.style.color = '#9ca3af';
      }
      return;
    }

    const sec = Math.round(ms / 1000);
    const label = sec >= 60 ? `${Math.round(sec / 60)}分` : `${sec}秒`;
    if (syncIntervalIndicator) {
      syncIntervalIndicator.textContent = `🟢 ${label}周期で自動同期中`;
      syncIntervalIndicator.style.color = '#10b981';
    }

    autoSyncIntervalTimer = setInterval(async () => {
      if (document.visibilityState === 'hidden') return;
      saveLocalDraft();

      if (hasPendingChanges) {
        await pushToCloud(true);
      } else {
        await pullFromCloud(true);
      }
    }, ms);
  }

  if (syncIntervalSelect) {
    syncIntervalSelect.addEventListener('change', (e) => {
      const selectedMs = parseInt(e.target.value, 10);
      setupAutoSyncInterval(selectedMs);
      const sec = Math.round(selectedMs / 1000);
      if (selectedMs > 0) {
        showToast(`⏱️ 自動保存・同期の周期を ${sec >= 60 ? Math.round(sec / 60) + '分' : sec + '秒'} に設定しました`);
      } else {
        showToast('⏱️ 自動周期保存をオフにしました');
      }
    });
  }

  // Initial Auto Sync Interval Setup
  const savedIntervalMs = localStorage.getItem(SYNC_INTERVAL_STORAGE_KEY) || '10000';
  setupAutoSyncInterval(savedIntervalMs);

  const btnClearDraft = document.getElementById('btn-clear-draft');
  if (btnClearDraft) {
    btnClearDraft.addEventListener('click', clearLocalDraft);
  }

  // Handle Tab Switcher inside Sync Modal
  function switchSyncTab(activeTabName) {
    [btnSyncTabAuto, btnSyncTabQr, btnSyncTabClip].forEach(btn => btn?.classList.remove('active'));
    [syncPanelAuto, syncPanelQr, syncPanelClip].forEach(panel => panel?.classList.remove('active'));

    if (activeTabName === 'auto') {
      btnSyncTabAuto?.classList.add('active');
      syncPanelAuto?.classList.add('active');
    } else if (activeTabName === 'qr') {
      btnSyncTabQr?.classList.add('active');
      syncPanelQr?.classList.add('active');
      renderMobileQrCode();
    } else if (activeTabName === 'clip') {
      btnSyncTabClip?.classList.add('active');
      syncPanelClip?.classList.add('active');
    }
  }

  if (btnSyncTabAuto) btnSyncTabAuto.addEventListener('click', () => switchSyncTab('auto'));
  if (btnSyncTabQr) btnSyncTabQr.addEventListener('click', () => switchSyncTab('qr'));
  if (btnSyncTabClip) btnSyncTabClip.addEventListener('click', () => switchSyncTab('clip'));

  // QR Code Rendering with Sync Code & URL
  function renderMobileQrCode(targetUrl) {
    let fullUrl = targetUrl;
    const syncCode = getSyncCode();

    if (!fullUrl) {
      if (currentSyncType === 'remote') {
        const isGitHubPages = window.location.hostname.includes('github.io');
        const baseUrl = isGitHubPages ? window.location.origin + window.location.pathname : githubPagesDefaultUrl;
        const urlObj = new URL(baseUrl);
        urlObj.searchParams.set('sync', syncCode);
        fullUrl = urlObj.toString();
      } else {
        let host = window.location.hostname;
        if (!host || host === 'localhost' || host === '127.0.0.1') {
          host = '192.168.0.12';
        }
        let port = window.location.port;
        const protocol = window.location.protocol.startsWith('http') ? window.location.protocol : 'http:';
        const baseUrl = `${protocol}//${host}${port ? ':' + port : ''}/index.html`;
        const urlObj = new URL(baseUrl);
        urlObj.searchParams.set('sync', syncCode);
        fullUrl = urlObj.toString();
      }
    }

    if (mobileAccessUrl) {
      mobileAccessUrl.value = fullUrl;
    }

    if (qrcodeContainer && typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(fullUrl);
        qr.make();
        qrcodeContainer.innerHTML = qr.createImgTag(5, 6);
      } catch (e) {
        qrcodeContainer.innerHTML = `<p style="color: #000; font-size: 0.8rem;">QRコード生成エラー: ${e.message}</p>`;
      }
    }
  }

  if (btnSyncTypeWifi && btnSyncTypeRemote) {
    btnSyncTypeWifi.addEventListener('click', () => {
      currentSyncType = 'wifi';
      btnSyncTypeWifi.classList.add('active');
      btnSyncTypeWifi.style.fontWeight = '600';
      btnSyncTypeRemote.classList.remove('active');
      btnSyncTypeRemote.style.fontWeight = 'normal';
      if (mobileSyncDesc) {
        mobileSyncDesc.innerHTML = '同一Wi-Fiに接続したiPhoneの<strong>カメラアプリ</strong>で以下のQRコードをかざしてください。自動連携でSafariが起動します。';
      }
      renderMobileQrCode();
    });

    btnSyncTypeRemote.addEventListener('click', () => {
      currentSyncType = 'remote';
      btnSyncTypeRemote.classList.add('active');
      btnSyncTypeRemote.style.fontWeight = '600';
      btnSyncTypeWifi.classList.remove('active');
      btnSyncTypeWifi.style.fontWeight = 'normal';
      if (mobileSyncDesc) {
        mobileSyncDesc.innerHTML = '外出先からアクセス可能な<strong>公開URL（GitHub Pages等）</strong>です。カメラで読み取ってSafariで起動します。';
      }
      renderMobileQrCode();
    });
  }

  if (mobileAccessUrl) {
    mobileAccessUrl.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (currentSyncType === 'remote' && url) {
        localStorage.setItem('tamaki_remote_url', url);
      }
      renderMobileQrCode(url);
    });
  }

  // Buttons in Sync Modal
  if (btnGenSyncCode) {
    btnGenSyncCode.addEventListener('click', () => {
      const newCode = generateRandomSyncCode();
      if (syncCodeInput) syncCodeInput.value = newCode;
    });
  }

  if (btnSaveSyncCode) {
    btnSaveSyncCode.addEventListener('click', () => {
      if (syncCodeInput && syncCodeInput.value) {
        setSyncCode(syncCodeInput.value);
      }
    });
  }

  if (btnPullCloudSync) {
    btnPullCloudSync.addEventListener('click', () => pullFromCloud(false));
  }

  if (btnPushCloudSync) {
    btnPushCloudSync.addEventListener('click', () => pushToCloud(false));
  }

  // Universal Clipboard Sync Buttons
  if (btnCopyClipboardSync) {
    btnCopyClipboardSync.addEventListener('click', () => {
      const payload = getCurrentDraftPayload();
      const jsonStr = JSON.stringify(payload);
      navigator.clipboard.writeText(jsonStr).then(() => {
        showToast('📋 全作業データをクリップボードにコピーしました！');
      }).catch(() => {
        showToast('コピーに失敗しました。手動でコピーしてください。');
      });
    });
  }

  if (btnRestoreClipboardSync) {
    btnRestoreClipboardSync.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.includes('syncCode')) {
          const payload = JSON.parse(text);
          applyDraftPayload(payload, false);
        } else {
          showToast('クリップボードに有効なTamaki Studioのデータがありません');
        }
      } catch (e) {
        showToast('クリップボードの読み込み許可が必要です');
      }
    });
  }

  // Mobile Sync Modal Toggle Buttons
  if (btnMobileSync && modalMobileSync) {
    btnMobileSync.addEventListener('click', () => {
      if (syncCodeInput) syncCodeInput.value = getSyncCode();
      renderMobileQrCode();
      modalMobileSync.classList.remove('hidden');
    });

    if (btnCloseMobileModal) {
      btnCloseMobileModal.addEventListener('click', () => modalMobileSync.classList.add('hidden'));
    }
    if (btnCloseMobileFooter) {
      btnCloseMobileFooter.addEventListener('click', () => modalMobileSync.classList.add('hidden'));
    }

    if (btnCopyMobileUrl) {
      btnCopyMobileUrl.addEventListener('click', () => {
        if (mobileAccessUrl) {
          navigator.clipboard.writeText(mobileAccessUrl.value).then(() => {
            showToast('アクセスURLをコピーしました！');
          });
        }
      });
    }
  }

  // Mobile Bottom Navigation Handler for Sync Tab
  const btnMobTabSync = document.getElementById('btn-mob-tab-sync');
  if (btnMobTabSync && modalMobileSync) {
    btnMobTabSync.addEventListener('click', () => {
      if (syncCodeInput) syncCodeInput.value = getSyncCode();
      renderMobileQrCode();
      modalMobileSync.classList.remove('hidden');
      pullFromCloud(true);
    });
  }

  // Parse URL query params for 1-tap pairing or draft restoration
  function parseUrlParamsOnLaunch() {
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('sync');
    const draftParam = params.get('draft');

    if (syncParam) {
      const cleanSync = syncParam.trim().toUpperCase();
      localStorage.setItem('tamaki_sync_code', cleanSync);
      if (syncCodeInput) syncCodeInput.value = cleanSync;
      showToast(`🔗 同期コード [${cleanSync}] でペアリングしました`);
    }

    if (draftParam) {
      try {
        const decodedText = decodeURIComponent(draftParam);
        if (decodedText && outputEditor) {
          outputEditor.value = decodedText;
          updateStats();
          showToast('📱 QRコードから文章を引き継ぎました！');
        }
      } catch (e) {}
    }

    // Auto pull from cloud on startup
    pullFromCloud(true);
  }

  // Visibility change listener to pull newest draft when tab returns to focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pullFromCloud(true);
    }
  });

  // Launch initial sync check
  parseUrlParamsOnLaunch();

  // Close modals on backdrop click
  [modalApiSettings, modalHistory, modalGuide, modalMobileSync].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  // Service Worker Registration for Offline PWA Support & Auto Update
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.update();
      }).catch((e) => {
        console.log('SW registration note:', e);
      });
    });
  }

  // Initial setup
  loadLocalDraft();
  renderPalette();
  updateStats();
});
