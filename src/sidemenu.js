// Ver.1.6で追加: レフトサイドメニュー機能管理クラス
class SideMenu {
  static initialize() {
    this.setupEventListeners();
    this.loadSavedFieldsList();
  }
  
  // イベントリスナーの設定
  static setupEventListeners() {
    // カスタム盤面編集ボタン
    document.getElementById('btn-custom-editor').addEventListener('click', () => {
      this.openCustomEditor();
    });
    
    // プリセット読み込みボタン
    document.getElementById('btn-load-preset').addEventListener('click', () => {
      this.showPresetModal();
    });
    
    // 盤面保存ボタン
    document.getElementById('btn-save-field').addEventListener('click', () => {
      this.saveCurrentField();
    });
    
    // 盤面読み込みボタン
    document.getElementById('btn-load-field').addEventListener('click', () => {
      this.showLoadFieldModal();
    });
    
    // 外部コード読み込みボタン
    document.getElementById('btn-import-field').addEventListener('click', () => {
      this.showImportFieldModal();
    });
    
    // 連鎖プレビューボタン
    document.getElementById('btn-chain-preview').addEventListener('click', () => {
      this.startChainPreview();
    });
    
    // ステップ連鎖ボタン
    document.getElementById('btn-step-chain').addEventListener('click', () => {
      this.startStepChain();
    });

    const exportBtn = document.getElementById('btn-export-field-code');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const format = document.getElementById('field-code-format').value;
        let code = '';
        if (format === 'standard') {
          code = SideMenu.encodeStandard();
        } else if (format === 'puyop') {
          code = SideMenu.encodePuyop();
        } else if (format === 'pndsng') {
          code = SideMenu.encodePndsng();
        }
        SideMenu.showExportCodeModal(code, format);
      });
    }
  }
  
  // カスタム盤面編集画面を開く
  static openCustomEditor() {
    window.open('custom.html', '_blank', 'width=800,height=600');
  }
  
  // プリセット選択モーダルを表示
  static showPresetModal() {
    const modal = this.createModal('プリセット選択', this.getPresetContent());
    document.body.appendChild(modal);
  }
  
  // 現在の盤面を保存
  static saveCurrentField() {
    const fieldCode = this.generateFieldCode();
    const name = prompt('保存名を入力してください:', `盤面_${new Date().toLocaleDateString()}`);
    
    if (name && name.trim()) {
      this.saveFieldToStorage(name.trim(), fieldCode);
      this.loadSavedFieldsList();
      alert('盤面を保存しました');
    }
  }
  
  // 保存済み盤面読み込みモーダルを表示
  static showLoadFieldModal() {
    const modal = this.createModal('盤面読み込み', this.getLoadFieldContent());
    document.body.appendChild(modal);
  }
  
  // 外部フィールドコード読み込みモーダルを表示
  static showImportFieldModal() {
    const modal = this.createModal('外部フィールドコード読み込み', this.getImportFieldContent());
    document.body.appendChild(modal);
  }
  
  // 連鎖プレビューを開始
  static startChainPreview() {
    if (typeof ChainPreview !== 'undefined') {
      ChainPreview.startPreview();
    } else {
      alert('連鎖プレビュー機能が読み込まれていません');
    }
  }
  
  // ステップ連鎖を開始
  static startStepChain() {
    if (typeof ChainPreview !== 'undefined') {
      ChainPreview.startPreview();
    } else {
      alert('ステップ連鎖機能が読み込まれていません');
    }
  }
  
  // 現在の盤面からフィールドコードを生成
  static generateFieldCode() {
    let code = '';
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y] && Stage.board[y][x];
        if (cell && cell.puyo) {
          code += cell.puyo;
        } else {
          code += '0';
        }
      }
    }
    return code;
  }
  
  // Ver.1.9で完全改修: フィールドコードから盤面を復元
  static loadFieldFromCode(code) {
    if (code.length !== Config.stageRows * Config.stageCols) {
      alert('フィールドコードの形式が正しくありません');
      return false;
    }
    
    // 1. カスタム盤面データの読み込み（メモリ保存）
    this.customFieldData = {
      code: code,
      boardData: []
    };
    
    // フィールドコードを盤面データに変換
    for (let y = 0; y < Config.stageRows; y++) {
      this.customFieldData.boardData[y] = [];
      for (let x = 0; x < Config.stageCols; x++) {
        const index = y * Config.stageCols + x;
        const puyoType = parseInt(code[index]);
        this.customFieldData.boardData[y][x] = (puyoType >= 1 && puyoType <= 5) ? puyoType : 0;
      }
    }
    
    // 2. ループ初期化
    this.initializeGameLoop();
    
    // 3. すべてのロジック処理を完全停止して待機（checkFall実行前に停止）
    if (typeof stopGameLoop !== 'undefined') {
      stopGameLoop(); // Game.jsのメインループを完全停止
    }
    this.enterCustomFieldMode();
    
    // 4. メイン盤面にカスタム盤面を反映
    this.applyCustomFieldToMain();
    
    return true;
  }
  
  // Ver.1.9で追加: カスタム盤面モードに入る（完全停止状態）
  static enterCustomFieldMode() {
    // プレイヤー制御を完全停止
    if (typeof Player !== 'undefined') {
      Player.isCustomFieldMode = true;
      Player.isGameActive = false;
      if (Player.pauseFall) {
        Player.pauseFall();
      }
    }
    
    // カスタム盤面用のコントロールボタンを表示
    this.showCustomFieldControls();
  }
  
  // Ver.1.9で追加: カスタム盤面をメイン盤面に適用
  static applyCustomFieldToMain() {
    // 現在の盤面をクリア
    this.clearCurrentField();
    
    // カスタム盤面データを適用
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const puyoType = this.customFieldData.boardData[y][x];
        if (puyoType >= 1 && puyoType <= 5) {
          Stage.setPuyo(x, y, puyoType);
          Stage.puyoCount++;
        }
      }
    }
  }
  
  // Ver.1.9で追加: カスタム盤面用コントロール表示
  static showCustomFieldControls() {
    // 既存のボタンがある場合は削除
    const existingControls = document.getElementById('custom-field-controls');
    if (existingControls) {
      existingControls.remove();
    }
    
    // カスタム盤面専用コントロールパネルを作成
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-field-controls';
    controlPanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,255,255,0.95);
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 1000;
      text-align: center;
      border: 3px solid #2c3e50;
    `;
    
    controlPanel.innerHTML = `
      <h3 style="margin-top: 0; color: #2c3e50;">カスタム盤面読み込み完了</h3>
      <p style="color: #34495e; margin-bottom: 20px;">操作を選択してください</p>
      <div style="margin-bottom: 15px;">
        <button onclick="SideMenu.startCustomChainPreview()" style="
          width: 200px; 
          padding: 12px; 
          margin: 5px; 
          background-color: #1abc9c; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
        ">🔍 連鎖プレビュー</button>
      </div>
      <div>
        <button onclick="SideMenu.resumeNormalPlay()" style="
          width: 200px; 
          padding: 12px; 
          margin: 5px; 
          background-color: #27ae60; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
        ">▶️ 通常プレイ開始</button>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
  }
  
  // Ver.1.9で追加: カスタム盤面用連鎖プレビュー開始
  static startCustomChainPreview() {
    this.hideCustomFieldControls();
    ChainPreview.startPreview('main');
  }
  
  // Ver.1.9で追加: カスタム盤面用ステップ連鎖開始
  static startCustomStepChain() {
    this.hideCustomFieldControls();
    ChainPreview.startPreview('main');
  }
  
  // Ver.1.9で追加: 通常プレイ再開
  static resumeNormalPlay() {
    this.hideCustomFieldControls();
    
    // Game.jsのメインループを再開
    if (typeof resumeGameLoop !== 'undefined') {
      resumeGameLoop();
    }
    
    // プレイヤー制御を再開
    if (typeof Player !== 'undefined') {
      Player.isCustomFieldMode = false;
      Player.isGameActive = true;
      if (Player.resumeFall) {
        Player.resumeFall();
      }
    }
  }
  
  // Ver.1.9で追加: カスタム盤面コントロールを非表示
  static hideCustomFieldControls() {
    const controls = document.getElementById('custom-field-controls');
    if (controls) {
      controls.remove();
    }
  }
  
  // Ver.1.8で追加: ゲームループ初期化
  static initializeGameLoop() {
    // Ver.1.9で追加: Game.jsループの状態をリセット
    if (typeof resumeGameLoop !== 'undefined') {
      resumeGameLoop(); // まず停止状態を解除
    }
    
    // グローバル変数を初期化
    if (typeof setGameMode !== 'undefined') {
      setGameMode('start');
    } else if (typeof mode !== 'undefined') {
      mode = 'start';
    }
    if (typeof combinationCount !== 'undefined') {
      combinationCount = 0;
    }
    if (typeof frame !== 'undefined') {
      frame = 0;
    }
    
    // プレイヤーの状態をクリア（操作中のぷよがあれば削除）
    if (Player.centerPuyoElement) {
      Stage.stageElement.removeChild(Player.centerPuyoElement);
      Player.centerPuyoElement = null;
    }
    if (Player.movablePuyoElement) {
      Stage.stageElement.removeChild(Player.movablePuyoElement);
      Player.movablePuyoElement = null;
    }
    if (Player.ghostCenterPuyoElement) {
      Stage.stageElement.removeChild(Player.ghostCenterPuyoElement);
      Player.ghostCenterPuyoElement = null;
    }
    if (Player.ghostMovablePuyoElement) {
      Stage.stageElement.removeChild(Player.ghostMovablePuyoElement);
      Player.ghostMovablePuyoElement = null;
    }
    
    // 全消し表示を非表示
    if (Stage.zenkeshiImage) {
      Stage.zenkeshiImage.style.display = 'none';
    }
    
    // ばたんきゅー画像も非表示
    if (PuyoImage.batankyuImage) {
      if (PuyoImage.batankyuImage.parentNode) {
        PuyoImage.batankyuImage.parentNode.removeChild(PuyoImage.batankyuImage);
      }
    }
    
    // コンティニューテキストも非表示
    const continueText = document.getElementById('continue-text');
    if (continueText) {
      continueText.style.display = 'none';
    }
    
    // 落下コントロールの状態をリセット
    if (Player.fallControlStatus) {
      Player.fallControlStatus = false;
      Player.updateFallControlButton();
    }
  }
  
  // 現在の盤面をクリア
  static clearCurrentField() {
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y] && Stage.board[y][x];
        if (cell && cell.element) {
          Stage.stageElement.removeChild(cell.element);
        }
        if (Stage.board[y]) {
          Stage.board[y][x] = null;
        }
      }
    }
    Stage.puyoCount = 0;
  }
  
  // ローカルストレージに盤面を保存
  static saveFieldToStorage(name, code) {
    const savedFields = JSON.parse(localStorage.getItem('puyoSavedFields') || '{}');
    savedFields[name] = {
      code: code,
      date: new Date().toISOString()
    };
    localStorage.setItem('puyoSavedFields', JSON.stringify(savedFields));
  }
  
  // 保存済み盤面リストを更新
  static loadSavedFieldsList() {
    const savedFields = JSON.parse(localStorage.getItem('puyoSavedFields') || '{}');
    const listElement = document.getElementById('saved-fields-list');
    
    if (Object.keys(savedFields).length === 0) {
      listElement.innerHTML = '<p style="margin: 0; color: #bdc3c7; text-align: center; font-size: 12px;">保存済みデータなし</p>';
      return;
    }
    
    let html = '';
    Object.entries(savedFields).forEach(([name, data]) => {
      const date = new Date(data.date).toLocaleDateString();
      html += `
        <div style="
          margin-bottom: 8px; 
          padding: 8px; 
          background-color: #485562; 
          border-radius: 3px; 
          cursor: pointer;
          font-size: 12px;
        " onclick="SideMenu.loadFieldFromStorage('${name}')">
          <div style="font-weight: bold; color: #ecf0f1;">${name}</div>
          <div style="color: #bdc3c7;">${date}</div>
        </div>
      `;
    });
    
    listElement.innerHTML = html;
  }
  
  // ストレージから盤面を読み込み
  static loadFieldFromStorage(name) {
    const savedFields = JSON.parse(localStorage.getItem('puyoSavedFields') || '{}');
    if (savedFields[name]) {
      if (confirm(`「${name}」を読み込みますか？現在の盤面は失われます。`)) {
        this.loadFieldFromCode(savedFields[name].code);
        alert('盤面を読み込みました');
      }
    }
  }
  
  // モーダルダイアログの作成
  static createModal(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      background-color: rgba(0,0,0,0.7); 
      z-index: 1000; 
      display: flex; 
      justify-content: center; 
      align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white; 
      padding: 20px; 
      border-radius: 10px; 
      max-width: 500px; 
      max-height: 80vh; 
      overflow-y: auto;
    `;
    
    modalContent.innerHTML = `
      <h3 style="margin-top: 0;">${title}</h3>
      ${content}
      <button onclick="this.closest('.modal').remove()" style="
        margin-top: 15px; 
        padding: 8px 16px; 
        background-color: #e74c3c; 
        color: white; 
        border: none; 
        border-radius: 5px; 
        cursor: pointer;
      ">閉じる</button>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    
    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    return modal;
  }
  
  // プリセット選択のコンテンツ
  static getPresetContent() {
    return `
      <div style="margin-bottom: 15px;">
        <h4>連鎖の種</h4>
        <button onclick="SideMenu.loadPreset('chain_seed_1')" style="margin: 5px; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">2連鎖の種</button>
        <button onclick="SideMenu.loadPreset('chain_seed_2')" style="margin: 5px; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">3連鎖の種</button>
        <button onclick="SideMenu.loadPreset('chain_seed_3')" style="margin: 5px; padding: 8px; background-color: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">4連鎖の種</button>
      </div>
      <div style="margin-bottom: 15px;">
        <h4>大連鎖</h4>
        <button onclick="SideMenu.loadPreset('big_chain_1')" style="margin: 5px; padding: 8px; background-color: #9b59b6; color: white; border: none; border-radius: 3px; cursor: pointer;">5連鎖</button>
        <button onclick="SideMenu.loadPreset('big_chain_2')" style="margin: 5px; padding: 8px; background-color: #9b59b6; color: white; border: none; border-radius: 3px; cursor: pointer;">7連鎖</button>
        <button onclick="SideMenu.loadPreset('big_chain_3')" style="margin: 5px; padding: 8px; background-color: #9b59b6; color: white; border: none; border-radius: 3px; cursor: pointer;">10連鎖</button>
        <button onclick="SideMenu.loadPreset('test_17chain')" style="margin: 5px; padding: 8px; background-color: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">17連鎖テスト</button>
      </div>
    `;
  }
  
  // 盤面読み込みのコンテンツ
  static getLoadFieldContent() {
    const savedFields = JSON.parse(localStorage.getItem('puyoSavedFields') || '{}');
    let content = '<div style="margin-bottom: 15px;">';
    
    if (Object.keys(savedFields).length === 0) {
      content += '<p>保存済みの盤面がありません。</p>';
    } else {
      Object.entries(savedFields).forEach(([name, data]) => {
        const date = new Date(data.date).toLocaleDateString();
        content += `
          <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
            <strong>${name}</strong><br>
            <small>保存日: ${date}</small><br>
            <button onclick="SideMenu.loadFieldFromStorage('${name}'); this.closest('.modal').remove();" style="
              margin-top: 5px; 
              padding: 5px 10px; 
              background-color: #27ae60; 
              color: white; 
              border: none; 
              border-radius: 3px; 
              cursor: pointer;
            ">読み込み</button>
            <button onclick="SideMenu.deleteFieldFromStorage('${name}'); this.closest('.modal').remove(); SideMenu.showLoadFieldModal();" style="
              margin-top: 5px; 
              margin-left: 5px; 
              padding: 5px 10px; 
              background-color: #e74c3c; 
              color: white; 
              border: none; 
              border-radius: 3px; 
              cursor: pointer;
            ">削除</button>
          </div>
        `;
      });
    }
    
    content += '</div>';
    return content;
  }
  
  // 外部フィールドコード読み込みのコンテンツ
  static getImportFieldContent() {
    return `
      <div style="margin-bottom: 15px;">
        <label for="external-code">フィールドコードを入力してください:</label><br>
        <textarea id="external-code" style="width: 100%; height: 100px; margin-top: 5px; padding: 5px;" placeholder="72文字のフィールドコードを入力..."></textarea>
      </div>
      <button onclick="SideMenu.importExternalField()" style="
        padding: 8px 16px; 
        background-color: #27ae60; 
        color: white; 
        border: none; 
        border-radius: 5px; 
        cursor: pointer;
      ">読み込み</button>
    `;
  }
  
  // 外部フィールドコードの読み込み
  static importExternalField() {
    const code = document.getElementById('external-code').value.trim();
    if (this.loadFieldFromCode(code)) {
      alert('フィールドコードを読み込みました');
      document.querySelector('.modal').remove();
    }
  }
  
  // ストレージから盤面データを削除
  static deleteFieldFromStorage(name) {
    if (confirm(`「${name}」を削除しますか？`)) {
      const savedFields = JSON.parse(localStorage.getItem('puyoSavedFields') || '{}');
      delete savedFields[name];
      localStorage.setItem('puyoSavedFields', JSON.stringify(savedFields));
      this.loadSavedFieldsList();
      alert('削除しました');
    }
  }
  
  // プリセット盤面の読み込み
  static loadPreset(presetType) {
    const presets = {
      'chain_seed_1': '000000000000000000000000000000000000000000000000000000001100001200001200',
      'chain_seed_2': '000000000000000000000000000000000000000000001100001200001200001300001300',
      'chain_seed_3': '000000000000000000000000000000001100001200001200001300001300001400001400',
      'big_chain_1': '000000000000000000000000112300112300112300445500445500445500445500445500',
      'big_chain_2': '000000000000112300112300112300445500445500445500112300112300445500445500',
      'big_chain_3': '112300112300112300112300445500445500445500445500112300445500112300445500',
      'test_17chain': '034350034353234354103435245124245124451234245123234513123451123451123451'  // Ver.1.8で追加: 17連鎖テスト用
    };
    
    if (presets[presetType]) {
      if (confirm('プリセットを読み込みますか？現在の盤面は失われます。')) {
        this.loadFieldFromCode(presets[presetType]);
        alert('プリセットを読み込みました');
        document.querySelector('.modal').remove();
      }
    }
  }

  // 標準形式（6x12, 0-6, 62進数）
  static encodeStandard() {
    let code = '';
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y] && Stage.board[y][x];
        code += cell && cell.puyo ? cell.puyo : '0';
      }
    }
    // 62進数変換（0-9a-zA-Z[]）
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]';
    let result = '';
    for (let i = 0; i < code.length; i += 1) {
      result += chars[parseInt(code[i], 10)] || '0';
    }
    return result;
  }

  // puyop.com形式（6x12, 1-6, 62進数）
  static encodePuyop() {
    let code = '';
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y] && Stage.board[y][x];
        // 0→0, 1-5→1-5, 6(おじゃま)→6
        code += cell && cell.puyo ? cell.puyo : '0';
      }
    }
    // 62進数変換
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[]';
    let result = '';
    for (let i = 0; i < code.length; i += 1) {
      result += chars[parseInt(code[i], 10)] || '0';
    }
    return result;
  }

  // pndsng.com形式（13x6, a-k, RLE圧縮）
  static encodePndsng() {
    // 13x6の空配列を用意し、6x12のデータを左上詰めでコピー
    const row = 13, col = 6;
    const map = Array.from({ length: row }, (_, y) => Array.from({ length: col }, (_, x) => 11)); // BLANK=11
    for (let y = 0; y < Math.min(Config.stageRows, row); y++) {
      for (let x = 0; x < Math.min(Config.stageCols, col); x++) {
        const cell = Stage.board[y] && Stage.board[y][x];
        map[y][x] = cell && cell.puyo ? cell.puyo - 1 : 11; // 0:空白, 1:赤→0, ...
      }
    }
    // RLE圧縮
    const key = ['a','b','c','d','e','f','g','h','i','j','k','l'];
    let pre = key[map[0][0]];
    let length = 0;
    let code = key[map[0][0]];
    for (let y = 0; y < row; y++) {
      for (let x = 0; x < col; x++) {
        if (key[map[y][x]] === pre) {
          length++;
        } else {
          if (length !== 1) code += length;
          code += key[map[y][x]];
          length = 1;
        }
        pre = key[map[y][x]];
      }
    }
    if (length !== 1) code += length;
    return code;
  }

  // 出力コード表示用モーダル
  static showExportCodeModal(code, format) {
    const formatLabel = {
      'standard': '標準形式',
      'puyop': 'puyop.com形式',
      'pndsng': 'pndsng.com形式'
    };
    const modal = this.createModal(
      `フィールドコード出力（${formatLabel[format] || format}）`,
      `<textarea style='width:100%;height:80px;font-size:16px;'>${code}</textarea>`
    );
    document.body.appendChild(modal);
  }
}