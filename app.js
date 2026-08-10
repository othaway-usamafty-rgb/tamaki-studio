/**
 * Tamaki Studio - Application Logic
 * たまきぱずず風 文書執筆・プロンプト生成工房
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Model Migration / Fallback
  let initialModel = localStorage.getItem('tamaki_gemini_model');
  const validModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  if (!initialModel || !validModels.includes(initialModel)) {
    initialModel = 'gemini-2.0-flash';
    localStorage.setItem('tamaki_gemini_model', initialModel);
  }

  const state = {
    currentMode: 'essay', // 'essay' | 'subculture' | 'novel'
    activeTab: 'preview', // 'preview' | 'prompt'
    apiKey: localStorage.getItem('tamaki_gemini_api_key') || '',
    apiModel: initialModel,
    history: JSON.parse(localStorage.getItem('tamaki_history') || '[]'),
    lastGeneratedPrompt: '',
    tuning: {
      meta: 3,   // 1: 控えめ, 2: 標準, 3: 全開
      detail: 3, // 1: 標準, 2: 高解像度, 3: 超高解像度
      tempo: 1,  // 1: スマホ短文, 2: 標準, 3: 重厚
      antiAi: true
    }
  };

  // Sample Presets for Each Mode
  const samples = {
    essay: {
      theme: "真夏の酷暑ゴルフと、最新冷却ギアへの散財（そして結局効いたもの）",
      experience: `・最高気温37度の炎天下、前半4ホール目で早くも頭痛と意識朦朧。
・気合を入れて買った「ペルチェ素子冷却ベスト（2万8千円）」と「超強力ハンディファン」をフル稼働。
・だがベストは30分でバッテリー切れ、ファンは熱風を吹き付けるだけのドライヤーと化す。
・同伴者に「それ、ただの重りじゃん」と笑われ、結局一番生き返ったのは茶店のおばちゃんがくれた無料の麦茶と冷たいおしぼりだった。
・道具への依存と格好つけが招いた惨敗。`,
      insight: `テクノロジーで自然の猛威をねじ伏せようとする現代人の傲慢と見栄。散財して最新ギアを買い漁る行為は、暑さ対策というより「万全な自分」という安心感を買っているだけに過ぎない。自然の前では、無理せず撤退する勇気と冷たい麦茶が最強。`,
      ending: `懲りずに来週のラウンドに向けて、Amazonで「最強ネッククーラー」をポチっている自分がいる。オチのない散財ループはまだ続く。`
    },
    subculture: {
      target: "機動戦士ガンダム 復讐のレクイエム / 近年の宇宙世紀スピンオフ作品群",
      doubts: `・圧倒的なUnreal EngineのリアルCGと海外向け展開は評価するが、「本当にガンダムである必然性」があるのか？
・ミリタリーアクションとしては面白いが、人間ドラマの泥臭さや、富野由悠季作品特有の「言葉のトゲ」「噛み合わないエゴのぶつかり合い」が綺麗に脱臭されている違和感。
・ガンダムという看板（IP）を背負わせただけの良質ミリタリーSFになっていないか？`,
      insight: `・バンダイナムコの世界展開戦略と欧米市場向けCGアニメのビジネス的要請（商業的背景への理解）。
・宇宙世紀のリアリズムとは単に「MSの装甲の汚れや傷」ではなく、「持たざる者たちの生活感、コロニーの空気感、理不尽な組織構造」。
・1st〜逆シャア〜閃光のハサウェイに至る宇宙世紀原理主義者の視点から、何が受け継がれ、何が抜け落ちているのかを比較論考。`,
      ending: `文句を言いつつも、配信開始日に正座して一気見してしまうのがオールドタイプの悲しい業（ごう）。ま、楽しければいいんじゃね？`
    },
    novel: {
      characters: `主人公（男）：42歳。中堅広告代理店の企画部長。妻子持ち。冷めたメタ認知で自分と相手を観察しながらも、情欲に抗えない。
相手（女性）：31歳。同部署のチーフ。仕事は完璧だが、二人きりになると脆く、甘えたような視線を送る。`,
      setting: `大型台風が直撃した夜のオフィス。全社員が退社した後の薄暗い応接室。窓を叩く激しい雨音と、エアコンの微かな送風音。濡れた服と微かな香水の匂い。`,
      focus: `・最初は「部長、ダメです」と拒否していた手が、服を解くにつれて強く背中に回るまでのグラデーション。
・行為の最中も、主人公の脳裏に「明日の企画会議のスケジュール」や「自分のみっともない独占欲」が冷徹に去来する二重構造（メタ認知）。
・生々しい吐息、ストッキングが擦れる音、肌の熱と冷たさの対比。`,
      ending: `行為の後の静寂。遠くのサイレンの音。ネクタイを結び直しながら見つめる、散らかったソファと戻らなければならない日常への帰還。`
    }
  };

  // ==========================================
  // 2. DOM Elements
  // ==========================================
  // Tabs
  const modeTabs = document.querySelectorAll('.mode-tab');
  const formTitle = document.getElementById('form-title');
  const btnLoadSample = document.getElementById('btn-load-sample');

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

  // AI Smell & Rewrite
  const aiSmellAlert = document.getElementById('ai-smell-alert');
  const aiSmellDetails = document.getElementById('ai-smell-details');
  const btnFixSmell = document.getElementById('btn-fix-smell');
  const rewriteChips = document.querySelectorAll('.rewrite-chip');

  // Modals
  const btnApiSettings = document.getElementById('btn-api-settings');
  const modalApiSettings = document.getElementById('modal-api-settings');
  const btnCloseApiModal = document.getElementById('btn-close-api-modal');
  const apiKeyInput = document.getElementById('api-key-input');
  const apiModelSelect = document.getElementById('api-model-select');
  const btnSaveApi = document.getElementById('btn-save-api');

  const btnHistory = document.getElementById('btn-history');
  const modalHistory = document.getElementById('modal-history');
  const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
  const historyList = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // ==========================================
  // 3. UI Interactions & Mode Switch
  // ==========================================

  function setMode(mode) {
    state.currentMode = mode;
    modeTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    fieldsEssay.classList.toggle('hidden', mode !== 'essay');
    fieldsSubculture.classList.toggle('hidden', mode !== 'subculture');
    fieldsNovel.classList.toggle('hidden', mode !== 'novel');

    if (mode === 'essay') {
      formTitle.textContent = '☕ エッセイ・コラム執筆設定';
    } else if (mode === 'subculture') {
      formTitle.textContent = '🤖 ガンダム・サブカル論考執筆設定';
    } else if (mode === 'novel') {
      formTitle.textContent = '📖 小説・官能描写執筆設定';
    }
  }

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode);
    });
  });

  // Load Sample
  btnLoadSample.addEventListener('click', () => {
    const sample = samples[state.currentMode];
    if (state.currentMode === 'essay') {
      document.getElementById('essay-theme').value = sample.theme;
      document.getElementById('essay-experience').value = sample.experience;
      document.getElementById('essay-insight').value = sample.insight;
      document.getElementById('essay-ending').value = sample.ending;
    } else if (state.currentMode === 'subculture') {
      document.getElementById('subculture-target').value = sample.target;
      document.getElementById('subculture-doubts').value = sample.doubts;
      document.getElementById('subculture-insight').value = sample.insight;
      document.getElementById('subculture-ending').value = sample.ending;
    } else if (state.currentMode === 'novel') {
      document.getElementById('novel-characters').value = sample.characters;
      document.getElementById('novel-setting').value = sample.setting;
      document.getElementById('novel-focus').value = sample.focus;
      document.getElementById('novel-ending').value = sample.ending;
    }
    showToast('例文を読み込みました！');
  });

  // Slider Updates
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
  // 4. Prompt Builder Logic
  // ==========================================

  function buildPrompt() {
    const mode = state.currentMode;
    const tuning = state.tuning;

    // Tuning instructions
    let metaInstruction = "";
    if (tuning.meta === 3) {
      metaInstruction = "【最重要】鋭いメタ認知（自己客観視）と自虐・セルフツッコミを前面に出し、格好つけや迷いをユーモラスに自己開示してください。";
    } else if (tuning.meta === 2) {
      metaInstruction = "適度に自分を客観視し、冷静な大人の視座を保ってください。";
    } else {
      metaInstruction = "自己開示は控えめに、客観的な事象を軸に記述してください。";
    }

    let detailInstruction = "";
    if (tuning.detail === 3) {
      detailInstruction = "【解像度】抽象表現は厳禁。具体的な固有名詞、温度、触覚、匂い、金額、生々しい試行錯誤の経過を高い解像度で描写してください。";
    } else {
      detailInstruction = "具体的なエピソードや状況を分かりやすく描写してください。";
    }

    let tempoInstruction = "";
    if (tuning.tempo === 1) {
      tempoInstruction = "【リズム】スマホ読者がテンポよく読めるよう、1〜2文ごとに空行を挟み、適度な余白と口語・倒置を織り交ぜてください。";
    } else if (tuning.tempo === 3) {
      tempoInstruction = "【リズム】重厚でじっくり読ませる長文スタイル。論理展開と情景描写の厚みを重視してください。";
    } else {
      tempoInstruction = "【リズム】標準的なエッセイ・記事の改行ペースで構成してください。";
    }

    const antiAiInstruction = tuning.antiAi ? `
## 厳格な禁止事項（AI臭さの完全排除）
- ❌ 「いかがでしたでしょうか？」「〜してみてはいかがでしょうか」「素晴らしい未来が待っています」「ぜひ試してみてください」「まとめると」などのテンプレ的まとめ表現は厳禁。
- ❌ 紋切り型の教訓や、教科書的な綺麗事の結論で無理やり美談に仕立てない。
- ❌ 思考のプロセス（迷いや試行錯誤の途中経過）を端折らない。
` : "";

    let prompt = "";

    if (mode === 'essay') {
      const theme = document.getElementById('essay-theme').value.trim() || samples.essay.theme;
      const experience = document.getElementById('essay-experience').value.trim() || samples.essay.experience;
      const insight = document.getElementById('essay-insight').value.trim() || samples.essay.insight;
      const ending = document.getElementById('essay-ending').value.trim() || samples.essay.ending;

      prompt = `# 指示
あなたは以下の【ペルソナ】と【執筆ルール】を持つエッセイスト・コラムニスト「たまきぱずず」です。
提供された【インプット情報】をもとに、読者を引き込み、共感と深い余韻を残すnote向けエッセイを作成してください。

---

## 1. ペルソナ・スタンス
- **基本姿勢**: 等身大・飾らない大人の知性。日常の体験、趣味（ゴルフ、読書、最新ツール、スポーツ観戦等）、思考の揺らぎを大切にする。
- ${metaInstruction}
- **本質志向と大人の分別**: 感情的な肯定・否定にとどまらず、背景にある「構造」「大人の事情・心理」も理解した上で物事の本質を突く。
- **読後感**: 熱く語った後も陶酔しきらず、自虐・セルフツッコミや、読者へのさりげない一言で軽やかに着地する。

---

## 2. 記事構成の基本フォーマット（4段構成）
1. **【導入・ツカミ】**: 読者の意表を突くフック（ミスディレクションや日常のふとした違和感）から入る。
2. **【展開・実体験と生々しいディテール】**: 実際に試したこと、起きた出来事を具体的な固有名詞や身体感覚を交えて描く。
3. **【深掘り・構造と本質の考察】**: 「なぜそうなったのか？」「何が本質なのか？」を一歩踏み込んで論理的・構造的に掘り下げる。
4. **【結び・オチ（余韻とセルフツッコミ）】**: 自分の思考に自らツッコミを入れ、軽妙に締めくくる。

---

## 3. 文体・チューニング
- **文体**: 丁寧な「です・ます」調をベースに、「〜じゃね？」「〜わ。」「・・・」などの口語・倒置を自然に挟む。
- ${detailInstruction}
- ${tempoInstruction}

${antiAiInstruction}

---

## 4. 今回のエッセイのインプット情報
- **テーマ・導入のツカミ**: ${theme}
- **実体験・生々しいディテールメモ**:
${experience}
- **深掘り・構造と本質の考察**: ${insight}
- **結び・オチのトーン**: ${ending}
`;
    } else if (mode === 'subculture') {
      const target = document.getElementById('subculture-target').value.trim() || samples.subculture.target;
      const doubts = document.getElementById('subculture-doubts').value.trim() || samples.subculture.doubts;
      const insight = document.getElementById('subculture-insight').value.trim() || samples.subculture.insight;
      const ending = document.getElementById('subculture-ending').value.trim() || samples.subculture.ending;

      prompt = `# 指示
あなたは熱烈かつ冷徹なサブカルチャー・SF評論家（自称：オールドタイプ宇宙世紀原理主義者「たまきぱずず」）です。
以下の【スタンス】と【執筆ルール】に基づき、単なるファンブログや無難な解説にとどまらない、本質を鋭く突いたガンダム論考・サブカル批評コラムを作成してください。

---

## 1. 批評スタンス・ペルソナ
- **宇宙世紀原理主義と美学**: 『機動戦士ガンダム（1st）』〜『逆襲のシャア』〜『閃光のハサウェイ』を宇宙世紀の正統・到達点とする美学を持つ。
- **「看板（IP）」と「本質」の峻別**: 「ガンダム（またはゴジラ）という看板がついているが、本当にガンダムである必然性があるのか？」「単なる舞台装置になっていないか？」という本質的問いを投げかける。
- **大人のビジネス視点（商業構造への理解）**: バンダイナムコ等の玩具展開、海外市場向けCG、ゲーム連動の要請を理解しつつ、作品の魂が見失われていないかを冷静に見定める。
- **科学・SF的リアリズムからのアプローチ**: アニメの描写や動機に対し、天文学、地球環境、コロニーの生活インフラ、物理法則などの現実的視点から切り込む。
- ${metaInstruction}

---

## 2. 記事構成フォーマット（論考・批評型）
1. **【導入・新情報やトピックの提示】**: 話題のニュースを紹介しつつ、初見の率直な違和感や引っかかりを提示する。
2. **【商業的背景の客観的分析】**: メーカーの狙い、商品展開、IPビジネスとしての必然性を冷静に解説する（頭ごなしの否定はしない）。
3. **【本質への問い・世界観の掘り下げ】**: 「ガンダムとは何か」「設定や動機の論理的破綻や面白さ」を深く論考する。
4. **【結び・オールドタイプとしての着地】**: 期待と不安を込めつつ、自嘲気味な肩書き（「オールドタイプのつぶやき」「単なる妄想かも」等）で軽やかに着地する。

---

## 3. 文体・チューニング
- **文体**: 「です・ます」を基調に、「〜じゃね？」「〜わ。」「〜なんですが。」といった口語のつぶやきを挟む。
- ${detailInstruction}
- ${tempoInstruction}

${antiAiInstruction}

---

## 4. 今回の論考のインプット情報
- **対象作品・トピック**: ${target}
- **感じた違和感・率直な本音**:
${doubts}
- **深掘りしたい論点・考察**: ${insight}
- **結びのトーン**: ${ending}
`;
    } else if (mode === 'novel') {
      const characters = document.getElementById('novel-characters').value.trim() || samples.novel.characters;
      const setting = document.getElementById('novel-setting').value.trim() || samples.novel.setting;
      const focus = document.getElementById('novel-focus').value.trim() || samples.novel.focus;
      const ending = document.getElementById('novel-ending').value.trim() || samples.novel.ending;

      prompt = `# 指示
あなたはリアリズムと大人の心理・情念の描写に長けた小説家「たまきぱずず」です。
以下の【描写ルール】と【シーン設計】に基づき、甘美なだけのファンタジーではなく、大人の息遣い、肌の温度、理性と本能のせめぎ合いが伝わる生々しく魅力的な大人の小説・官能シーンを執筆してください。

---

## 1. 描写と文体のルール
1. **具体的ディテールと五感描写（解像度の追求）**:
   - 抽象的な美辞麗句（「星が降るような快感」等）を排除し、車のシートの感触、暗いオフィスの静けさ、雨音、タバコの苦い後味、ストッキングを脱がす手つき、肌の温度差、汗の匂いなどを精密に描写する。
2. **冷徹な観察眼（メタ認知）と情欲の同居**:
   - ${metaInstruction}
   - 行為に没入しつつも、心のどこかで冷静に相手の反応や自分自身を観察している大人のモノローグ（「意外とつまらないかな？」「完全に堕ちた」「自分のみっともない独占欲」など）を差し込む。
3. **生々しい台詞と息遣い**:
   - 耳元での囁き、息が詰まるような喘ぎ声、ためらい、懇願（「お願い…」「貴方のものよ」等）のリアルな言葉を配置する。
4. **リズムと沈黙の演出**:
   - ${tempoInstruction}
   - 拒絶から受容へのグラデーション（最初は拒否されるが徐々に崩れていく過程）を丁寧に描く。

${antiAiInstruction}

---

## 2. 入力情報（シーン設計）
- **登場人物**:
${characters}
- **舞台・ロケーション・五感環境**: ${setting}
- **ハイライト・心理の焦点**:
${focus}
- **行為後の余韻・着地**: ${ending}
`;
    }

    state.lastGeneratedPrompt = prompt;
    return prompt;
  }

  // Build Prompt & Copy Button Click
  btnBuildPrompt.addEventListener('click', () => {
    const prompt = buildPrompt();
    outputEditor.value = prompt;
    switchOutputTab('prompt');
    updateStats(prompt);
    checkAiSmell(prompt);
    
    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('プロンプトを合成してコピーしました！');
    }).catch(() => {
      showToast('プロンプトを合成しました');
    });
  });

  // ==========================================
  // 5. Gemini API Direct Generation
  // ==========================================

  async function generateWithGemini(prompt, isRewrite = false, rewriteInstruction = "") {
    if (!state.apiKey) {
      openApiModal();
      showToast('Gemini APIキーを設定してください');
      return;
    }

    // Safety fallback for legacy / invalid models
    const validModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'];
    if (!validModels.includes(state.apiModel)) {
      state.apiModel = 'gemini-2.0-flash';
      localStorage.setItem('tamaki_gemini_model', state.apiModel);
      if (apiModelSelect) apiModelSelect.value = state.apiModel;
    }

    let finalPrompt = prompt;
    if (isRewrite) {
      finalPrompt = `${prompt}

---
【追加の推敲指示】
以下の点に特に重点を置いて、先ほどの文章をさらにブラッシュアップして再出力してください：
${rewriteInstruction}`;
    }

    // UI Loading
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = isRewrite ? 'たまきぱずず風に推敲中...' : 'たまきぱずず風に執筆中...';

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${state.apiModel}:generateContent?key=${state.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: finalPrompt }]
          }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        throw new Error('AIからの応答テキストが空でした');
      }

      outputEditor.value = generatedText;
      switchOutputTab('preview');
      updateStats(generatedText);
      checkAiSmell(generatedText);
      saveToHistory(state.currentMode, generatedText);
      showToast('執筆が完了しました！');

    } catch (err) {
      console.error(err);
      alert(`執筆中にエラーが発生しました:\n${err.message}\n\n※ APIキーが正しいか、設定をご確認ください。`);
    } finally {
      loadingOverlay.classList.add('hidden');
    }
  }

  btnAiGenerate.addEventListener('click', () => {
    const prompt = buildPrompt();
    generateWithGemini(prompt);
  });

  // ==========================================
  // 6. AI Smell Checker & Quick Rewrites
  // ==========================================

  const smellPatterns = [
    { pattern: /いかがでしたでしょうか/g, text: "「いかがでしたでしょうか」" },
    { pattern: /いかがだったでしょうか/g, text: "「いかがだったでしょうか」" },
    { pattern: /してみてはいかがでしょうか/g, text: "「〜してみてはいかがでしょうか」" },
    { pattern: /素晴らしい未来/g, text: "「素晴らしい未来」" },
    { pattern: /ぜひ参考にしてみてください/g, text: "「ぜひ参考にしてみてください」" },
    { pattern: /まとめると、/g, text: "「まとめると、」" },
    { pattern: /いかがでしたか/g, text: "「いかがでしたか」" }
  ];

  function checkAiSmell(text) {
    if (!text || state.activeTab === 'prompt') {
      aiSmellAlert.classList.add('hidden');
      return;
    }

    const detected = [];
    smellPatterns.forEach(item => {
      if (item.pattern.test(text)) {
        detected.push(item.text);
      }
    });

    if (detected.length > 0) {
      aiSmellAlert.classList.remove('hidden');
      aiSmellDetails.textContent = `テンプレ表現 ${detected.join('、')} が見つかりました。削除または自虐的な着地に修正することをおすすめします。`;
    } else {
      aiSmellAlert.classList.add('hidden');
    }
  }

  btnFixSmell.addEventListener('click', () => {
    alert("【AI臭さ解消のヒント】\n\n1. 記事の最後にある「いかがでしたでしょうか」をバッサリ削る。\n2. 教訓やまとめを書く代わりに、「…と、ここまで偉そうに語ったが、結局来週も同じ失敗をしそうだ」というセルフツッコミに置き換える。\n3. 「推敲アシスト」の「✨ AI臭さを徹底除去」ボタンを押すとAIが自動修正します。");
  });

  rewriteChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const action = chip.dataset.action;
      const currentText = outputEditor.value.trim();

      if (!currentText) {
        showToast('まず文章を執筆・生成してください');
        return;
      }

      let instruction = "";
      if (action === 'more-meta') {
        instruction = "筆者のメタ認知（自己客観視・見栄の告白・自虐的なセルフツッコミ）を大幅に増やし、読者がクスッと笑える人間味を強くしてください。";
      } else if (action === 'more-detail') {
        instruction = "抽象的な表現を削り、より生々しい五感（温度、音、匂い、触覚）、具体的な固有名詞、身体感覚の解像度を極限まで高めてください。";
      } else if (action === 'lighter-ending') {
        instruction = "結び（オチ）をもっと軽やかに、肩の力を抜いた大人のつぶやき・自嘲でサラリと着地させてください。綺麗事の教訓は排除してください。";
      } else if (action === 'clean-ai') {
        instruction = "「いかがでしたでしょうか」などのAI特有の紋切り型表現、テンプレ的なまとめ、教訓めいた綺麗事を完全に排除し、生身の人間のリアルな言葉に書き直してください。";
      }

      if (state.apiKey) {
        generateWithGemini(currentText, true, instruction);
      } else {
        // Build rewrite prompt for external AI
        const rewritePrompt = `# 指示
以下の文章は現在推敲中の原稿です。
【推敲指示】に基づき、筆者（たまきぱずず）の持ち味を最大限に引き出すようにリライトしてください。

---
【推敲指示】
${instruction}

---
【現在の原稿】
${currentText}
`;
        outputEditor.value = rewritePrompt;
        switchOutputTab('prompt');
        navigator.clipboard.writeText(rewritePrompt);
        showToast('推敲用プロンプトを合成・コピーしました！');
      }
    });
  });

  // ==========================================
  // 7. Output Stats & Editor Tabs
  // ==========================================

  function updateStats(text) {
    const chars = text.length;
    charCount.textContent = `${chars.toLocaleString()} 文字`;
    const minutes = Math.ceil(chars / 450);
    readTime.textContent = `読了 約${minutes}分`;
  }

  function switchOutputTab(tab) {
    state.activeTab = tab;
    tabPreview.classList.toggle('active', tab === 'preview');
    tabPromptView.classList.toggle('active', tab === 'prompt');

    if (tab === 'prompt') {
      if (state.lastGeneratedPrompt) {
        outputEditor.value = state.lastGeneratedPrompt;
      } else {
        outputEditor.value = buildPrompt();
      }
    }
    updateStats(outputEditor.value);
    checkAiSmell(outputEditor.value);
  }

  tabPreview.addEventListener('click', () => switchOutputTab('preview'));
  tabPromptView.addEventListener('click', () => switchOutputTab('prompt'));

  outputEditor.addEventListener('input', () => {
    updateStats(outputEditor.value);
    checkAiSmell(outputEditor.value);
  });

  // Copy Output
  btnCopyOutput.addEventListener('click', () => {
    const text = outputEditor.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('note用テキストをコピーしました！');
    });
  });

  // Download Markdown
  btnDownloadMd.addEventListener('click', () => {
    const text = outputEditor.value;
    if (!text) {
      showToast('保存するテキストがありません');
      return;
    }
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `note_${state.currentMode}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('.mdファイルを保存しました！');
  });

  function showToast(msg) {
    toastMessage.textContent = msg;
    toastMessage.classList.remove('hidden');
    setTimeout(() => {
      toastMessage.classList.add('hidden');
    }, 2500);
  }

  // ==========================================
  // 8. History Management
  // ==========================================

  function saveToHistory(mode, text) {
    if (!text) return;
    const title = text.slice(0, 30).replace(/^[#\s]+/, '') || '無題の記事';
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString('ja-JP'),
      mode: mode,
      title: title,
      content: text
    };
    state.history.unshift(entry);
    if (state.history.length > 20) state.history.pop();
    localStorage.setItem('tamaki_history', JSON.stringify(state.history));
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">まだ履歴はありません</div>';
      return;
    }

    historyList.innerHTML = state.history.map(item => {
      const modeEmoji = item.mode === 'essay' ? '☕' : item.mode === 'subculture' ? '🤖' : '📖';
      return `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-header">
            <span>${modeEmoji} ${item.mode}</span>
            <span>${item.date}</span>
          </div>
          <div class="history-item-title">${escapeHtml(item.title)}...</div>
          <div class="history-item-snippet">${escapeHtml(item.content.slice(0, 100))}...</div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id, 10);
        const item = state.history.find(h => h.id === id);
        if (item) {
          outputEditor.value = item.content;
          setMode(item.mode);
          switchOutputTab('preview');
          closeHistoryModal();
          showToast('履歴から復元しました');
        }
      });
    });
  }

  btnClearHistory.addEventListener('click', () => {
    if (confirm('すべての履歴を消去しますか？')) {
      state.history = [];
      localStorage.removeItem('tamaki_history');
      renderHistory();
      showToast('履歴を消去しました');
    }
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // ==========================================
  // 9. Modals Handling
  // ==========================================

  function openApiModal() {
    apiKeyInput.value = state.apiKey;
    apiModelSelect.value = state.apiModel;
    modalApiSettings.classList.remove('hidden');
  }

  function closeApiModal() {
    modalApiSettings.classList.add('hidden');
  }

  btnApiSettings.addEventListener('click', openApiModal);
  btnCloseApiModal.addEventListener('click', closeApiModal);

  btnSaveApi.addEventListener('click', () => {
    state.apiKey = apiKeyInput.value.trim();
    state.apiModel = apiModelSelect.value;
    localStorage.setItem('tamaki_gemini_api_key', state.apiKey);
    localStorage.setItem('tamaki_gemini_model', state.apiModel);
    closeApiModal();
    showToast('API設定を保存しました');
  });

  function openHistoryModal() {
    renderHistory();
    modalHistory.classList.remove('hidden');
  }

  function closeHistoryModal() {
    modalHistory.classList.add('hidden');
  }

  btnHistory.addEventListener('click', openHistoryModal);
  btnCloseHistoryModal.addEventListener('click', closeHistoryModal);

  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === modalApiSettings) closeApiModal();
    if (e.target === modalHistory) closeHistoryModal();
  });

  // Initial Check
  updateStats(outputEditor.value);
});
