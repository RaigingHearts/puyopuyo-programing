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
  
  // フィールドコードから盤面を復元
  static loadFieldFromCode(code) {
    if (code.length !== Config.stageRows * Config.stageCols) {
      alert('フィールドコードの形式が正しくありません');
      return false;
    }
    
    // Ver.1.9で変更: ループ処理初期化を最初に実行
    this.initializeGameLoop();
    
    // 現在の盤面をクリア
    this.clearCurrentField();
    
    // フィールドコードから盤面を復元
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const index = y * Config.stageCols + x;
        const puyoType = parseInt(code[index]);
        if (puyoType >= 1 && puyoType <= 5) {
          Stage.setPuyo(x, y, puyoType);
          Stage.puyoCount++;
        }
      }
    }
    
    // Ver.1.9で追加: カスタムデータ読み込み後に操作停止状態にする
    if (typeof Player !== 'undefined' && Player.pauseFall) {
      Player.pauseFall();
    }
    
    return true;
  }
  
  // Ver.1.8で追加: ゲームループ初期化
  static initializeGameLoop() {
    // グローバル変数を初期化
    if (typeof mode !== 'undefined') {
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
}