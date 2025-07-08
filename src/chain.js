// Ver.1.6で追加: 連鎖プレビューとステップ連鎖機能管理クラス
class ChainPreview {
  static previewBoard = [];
  static previewElements = [];
  static chainSteps = [];
  static currentStep = 0;
  static isPreviewMode = false;
  static autoPlayInterval = null;
  static previewType = 'modal'; // Ver.1.9で追加: 'modal' または 'main'
  static originalBoard = []; // Ver.1.9で追加: 元の盤面状態を保存
  
  // 連鎖プレビューを開始
  static startPreview(type = 'modal') {
    if (this.isPreviewMode) {
      this.stopPreview();
      return;
    }
    
    this.isPreviewMode = true;
    this.previewType = type; // Ver.1.9で追加
    this.currentStep = 0;
    this.copyBoardToPreview();
    this.chainSteps = [];
    
    // Ver.1.9で追加: メイン盤面プレビューの場合は元の盤面を保存
    if (this.previewType === 'main') {
      this.saveOriginalBoard();
    }
    
    // 連鎖をシミュレーション
    this.simulateChain();
    
    if (this.chainSteps.length === 0) {
      alert('連鎖が発生しません');
      this.isPreviewMode = false;
      return;
    }
    
    // プレビューUI作成（タイプに応じて分岐）
    if (this.previewType === 'main') {
      this.createMainPreviewUI();
    } else {
      this.createPreviewUI();
    }
    this.showStep(0);
  }
  
  // 連鎖プレビューを停止
  static stopPreview() {
    this.isPreviewMode = false;
    // 自動再生も停止
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    
    // Ver.1.9で追加: メイン盤面プレビューの場合は元の状態に復旧
    if (this.previewType === 'main') {
      this.restoreOriginalBoard();
      this.removeMainPreviewUI();
      
      // Ver.1.9で追加: カスタム盤面モードの場合はコントロールパネルに戻る
      if (typeof Player !== 'undefined' && Player.isCustomFieldMode) {
        SideMenu.showCustomFieldControls();
      }
    } else {
      this.clearPreviewElements();
      this.removePreviewUI();
    }
  }
  
  // 現在の盤面をプレビュー用にコピー
  static copyBoardToPreview() {
    this.previewBoard = [];
    for (let y = 0; y < Config.stageRows; y++) {
      this.previewBoard[y] = [];
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y][x];
        if (cell && cell.puyo) {
          this.previewBoard[y][x] = cell.puyo;
        } else {
          this.previewBoard[y][x] = 0;
        }
      }
    }
  }
  
  // Ver.1.9で追加: 元の盤面状態を保存
  static saveOriginalBoard() {
    this.originalBoard = [];
    for (let y = 0; y < Config.stageRows; y++) {
      this.originalBoard[y] = [];
      for (let x = 0; x < Config.stageCols; x++) {
        const cell = Stage.board[y][x];
        if (cell && cell.puyo) {
          this.originalBoard[y][x] = cell.puyo;
        } else {
          this.originalBoard[y][x] = 0;
        }
      }
    }
  }
  
  // Ver.1.9で追加: 元の盤面状態に復旧
  static restoreOriginalBoard() {
    // 現在の盤面をクリア
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
    
    // 元の状態に復旧
    Stage.puyoCount = 0;
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const puyoType = this.originalBoard[y][x];
        if (puyoType >= 1 && puyoType <= 5) {
          Stage.setPuyo(x, y, puyoType);
          Stage.puyoCount++;
        }
      }
    }
  }
  
  // 連鎖をシミュレーション
  static simulateChain() {
    let chainCount = 0;
    let totalScore = 0;
    
    while (true) {
      // 落下処理
      this.simulateFall();
      
      // 消去判定
      const eraseResult = this.simulateErase();
      if (!eraseResult) {
        break; // 消去できない場合は連鎖終了
      }
      
      chainCount++;
      totalScore += this.calculateChainScore(eraseResult, chainCount);
      
      // 連鎖ステップを保存
      this.chainSteps.push({
        step: chainCount,
        board: this.copyPreviewBoard(),
        erasedPuyos: eraseResult.erasedPuyos,
        score: totalScore,
        chainScore: this.calculateChainScore(eraseResult, chainCount)
      });
      
      // 無限ループ防止
      if (chainCount > 20) {
        break;
      }
    }
  }
  
  // 落下シミュレーション
  static simulateFall() {
    let hasChanges = true;
    while (hasChanges) {
      hasChanges = false;
      for (let y = Config.stageRows - 2; y >= 0; y--) {
        for (let x = 0; x < Config.stageCols; x++) {
          if (this.previewBoard[y][x] !== 0 && this.previewBoard[y + 1][x] === 0) {
            this.previewBoard[y + 1][x] = this.previewBoard[y][x];
            this.previewBoard[y][x] = 0;
            hasChanges = true;
          }
        }
      }
    }
  }
  
  // 消去シミュレーション
  static simulateErase() {
    const toErase = [];
    const visited = [];
    
    // 初期化
    for (let y = 0; y < Config.stageRows; y++) {
      visited[y] = [];
      for (let x = 0; x < Config.stageCols; x++) {
        visited[y][x] = false;
      }
    }
    
    // 連続するぷよを探す
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        if (!visited[y][x] && this.previewBoard[y][x] >= 1 && this.previewBoard[y][x] <= 5) {
          const connected = this.findConnectedPuyos(x, y, this.previewBoard[y][x], visited);
          if (connected.length >= Config.erasePuyoCount) {
            toErase.push(...connected);
          }
        }
      }
    }
    
    if (toErase.length === 0) {
      return null;
    }
    
    // 消去実行
    const colorCount = {};
    for (const pos of toErase) {
      const color = this.previewBoard[pos.y][pos.x];
      colorCount[color] = (colorCount[color] || 0) + 1;
      this.previewBoard[pos.y][pos.x] = 0;
    }
    
    return {
      erasedPuyos: toErase,
      pieceCount: toErase.length,
      colorCount: Object.keys(colorCount).length
    };
  }
  
  // 連続するぷよを探す
  static findConnectedPuyos(startX, startY, targetColor, visited) {
    const connected = [];
    const stack = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop();
      
      if (x < 0 || x >= Config.stageCols || y < 0 || y >= Config.stageRows) continue;
      if (visited[y][x]) continue;
      if (this.previewBoard[y][x] !== targetColor) continue;
      
      visited[y][x] = true;
      connected.push({x, y});
      
      // 4方向に探索
      stack.push({x: x + 1, y: y});
      stack.push({x: x - 1, y: y});
      stack.push({x: x, y: y + 1});
      stack.push({x: x, y: y - 1});
    }
    
    return connected;
  }
  
  // プレビューボードをコピー
  static copyPreviewBoard() {
    const copy = [];
    for (let y = 0; y < Config.stageRows; y++) {
      copy[y] = [...this.previewBoard[y]];
    }
    return copy;
  }
  
  // 連鎖スコアを計算
  static calculateChainScore(eraseResult, chainCount) {
    const baseScore = eraseResult.pieceCount * 10;
    const chainBonus = Math.pow(2, chainCount - 1);
    const colorBonus = eraseResult.colorCount * 3;
    return baseScore * chainBonus + colorBonus;
  }
  
  // プレビューUIを作成
  static createPreviewUI() {
    const ui = document.createElement('div');
    ui.id = 'chain-preview-ui';
    ui.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 10000;
      min-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    ui.innerHTML = `
      <h3 style="margin-top: 0;">連鎖プレビュー</h3>
      <div id="chain-info" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
        <strong>連鎖数:</strong> ${this.chainSteps.length}連鎖<br>
        <strong>合計スコア:</strong> ${this.chainSteps[this.chainSteps.length - 1]?.score || 0}点
      </div>
      <div id="chain-step-display" style="margin-bottom: 15px; padding: 10px; background: #e9ecef; border-radius: 5px; min-height: 50px;">
        <!-- ステップ情報がここに表示される -->
      </div>
      <div style="text-align: center; margin-bottom: 15px;">
        <button id="prev-step-btn" style="margin: 0 5px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">前のステップ</button>
        <button id="next-step-btn" style="margin: 0 5px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">次のステップ</button>
        <button id="auto-play-btn" style="margin: 0 5px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">自動再生</button>
      </div>
      <div style="text-align: center;">
        <button onclick="ChainPreview.stopPreview()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">閉じる</button>
      </div>
    `;
    
    document.body.appendChild(ui);
    
    // イベントリスナー設定
    document.getElementById('prev-step-btn').addEventListener('click', () => this.showPrevStep());
    document.getElementById('next-step-btn').addEventListener('click', () => this.showNextStep());
    document.getElementById('auto-play-btn').addEventListener('click', () => this.toggleAutoPlay());
  }
  
  // プレビューUIを削除
  static removePreviewUI() {
    const ui = document.getElementById('chain-preview-ui');
    if (ui) {
      ui.remove();
    }
  }
  
  // 指定のステップを表示
  static showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.chainSteps.length) return;
    
    this.currentStep = stepIndex;
    const step = this.chainSteps[stepIndex];
    
    // Ver.1.9で変更: プレビュータイプに応じて表示処理を分岐
    if (this.previewType === 'main') {
      // メイン盤面での動的プレビュー
      this.updateMainPreviewDisplay(step.board, step.erasedPuyos);
      
      // メイン盤面用ステップ情報の更新
      const stepDisplay = document.getElementById('main-chain-step-display');
      if (stepDisplay) {
        stepDisplay.innerHTML = `
          <strong>${stepIndex + 1}/${this.chainSteps.length}:</strong> ${step.step}連鎖目<br>
          <strong>消去:</strong> ${step.erasedPuyos.length}個<br>
          <strong>スコア:</strong> ${step.chainScore}点
        `;
      }
      
      // メイン盤面用ボタンの状態更新
      const prevBtn = document.getElementById('main-prev-step-btn');
      const nextBtn = document.getElementById('main-next-step-btn');
      if (prevBtn) prevBtn.disabled = stepIndex === 0;
      if (nextBtn) nextBtn.disabled = stepIndex === this.chainSteps.length - 1;
    } else {
      // モーダル盤面での静的プレビュー
      this.updatePreviewDisplay(step.board, step.erasedPuyos);
      
      // ステップ情報の更新
      const stepDisplay = document.getElementById('chain-step-display');
      if (stepDisplay) {
        stepDisplay.innerHTML = `
          <strong>ステップ ${stepIndex + 1}:</strong> ${step.step}連鎖目<br>
          <strong>消去ぷよ数:</strong> ${step.erasedPuyos.length}個<br>
          <strong>このステップのスコア:</strong> ${step.chainScore}点<br>
          <strong>累計スコア:</strong> ${step.score}点
        `;
      }
      
      // ボタンの状態更新
      const prevBtn = document.getElementById('prev-step-btn');
      const nextBtn = document.getElementById('next-step-btn');
      if (prevBtn) prevBtn.disabled = stepIndex === 0;
      if (nextBtn) nextBtn.disabled = stepIndex === this.chainSteps.length - 1;
    }
  }
  
  // 前のステップを表示
  static showPrevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }
  
  // 次のステップを表示
  static showNextStep() {
    if (this.currentStep < this.chainSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }
  
  // 自動再生の切り替え
  static toggleAutoPlay() {
    if (this.autoPlayInterval) {
      // 自動再生停止
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      
      // Ver.1.9で変更: プレビュータイプに応じてボタンを選択
      const btnId = this.previewType === 'main' ? 'main-auto-play-btn' : 'auto-play-btn';
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.textContent = this.previewType === 'main' ? '自動' : '自動再生';
        btn.style.backgroundColor = '#28a745';
      }
    } else {
      // 自動再生開始
      this.autoPlayInterval = setInterval(() => {
        if (this.currentStep < this.chainSteps.length - 1) {
          this.showNextStep();
        } else {
          // 最後まで行ったら最初に戻る
          this.showStep(0);
        }
      }, 1500); // 1.5秒間隔
      
      // Ver.1.9で変更: プレビュータイプに応じてボタンを選択
      const btnId = this.previewType === 'main' ? 'main-auto-play-btn' : 'auto-play-btn';
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.textContent = '停止';
        btn.style.backgroundColor = '#dc3545';
      }
    }
  }
  
  // プレビュー表示の更新
  static updatePreviewDisplay(board, erasedPuyos) {
    this.clearPreviewElements();
    
    // 消去対象のぷよをハイライト
    const erasedSet = new Set(erasedPuyos.map(p => `${p.x},${p.y}`));
    
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        if (board[y][x] >= 1 && board[y][x] <= 5) {
          const puyoImage = PuyoImage.getPuyo(board[y][x]);
          puyoImage.style.position = 'absolute';
          puyoImage.style.left = x * Config.puyoImgWidth + 'px';
          puyoImage.style.top = y * Config.puyoImgHeight + 'px';
          puyoImage.style.zIndex = '1000';
          
          // 消去対象のぷよをハイライト
          if (erasedSet.has(`${x},${y}`)) {
            puyoImage.style.filter = 'brightness(150%) saturate(150%)';
            puyoImage.style.boxShadow = '0 0 10px rgba(255,0,0,0.8)';
          } else {
            puyoImage.style.opacity = '0.7';
          }
          
          Stage.stageElement.appendChild(puyoImage);
          this.previewElements.push(puyoImage);
        }
      }
    }
  }
  
  // プレビュー要素をクリア
  static clearPreviewElements() {
    this.previewElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.previewElements = [];
  }
  
  // Ver.1.9で追加: メイン盤面用プレビューUIを作成
  static createMainPreviewUI() {
    const ui = document.createElement('div');
    ui.id = 'main-chain-preview-ui';
    ui.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255,255,255,0.95);
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 500;
      min-width: 200px;
      border: 2px solid #34495e;
    `;
    
    ui.innerHTML = `
      <h4 style="margin-top: 0; color: #2c3e50;">連鎖プレビュー</h4>
      <div id="main-chain-info" style="margin-bottom: 10px; font-size: 12px; color: #2c3e50;">
        <strong>連鎖数:</strong> ${this.chainSteps.length}連鎖<br>
        <strong>合計スコア:</strong> ${this.chainSteps[this.chainSteps.length - 1]?.score || 0}点
      </div>
      <div id="main-chain-step-display" style="margin-bottom: 10px; font-size: 11px; color: #34495e; min-height: 30px;">
        <!-- ステップ情報がここに表示される -->
      </div>
      <div style="text-align: center;">
        <button id="main-prev-step-btn" style="margin: 2px; padding: 5px 8px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">前</button>
        <button id="main-next-step-btn" style="margin: 2px; padding: 5px 8px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">次</button>
        <button id="main-auto-play-btn" style="margin: 2px; padding: 5px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">自動</button>
      </div>
      <div style="text-align: center; margin-top: 8px;">
        <button onclick="ChainPreview.stopPreview()" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">終了</button>
      </div>
    `;
    
    document.body.appendChild(ui);
    
    // イベントリスナー設定
    document.getElementById('main-prev-step-btn').addEventListener('click', () => this.showPrevStep());
    document.getElementById('main-next-step-btn').addEventListener('click', () => this.showNextStep());
    document.getElementById('main-auto-play-btn').addEventListener('click', () => this.toggleAutoPlay());
  }
  
  // Ver.1.9で追加: メイン盤面用プレビューUIを削除
  static removeMainPreviewUI() {
    const ui = document.getElementById('main-chain-preview-ui');
    if (ui) {
      ui.remove();
    }
  }
  
  // Ver.1.9で追加: メイン盤面での動的プレビュー表示更新
  static updateMainPreviewDisplay(board, erasedPuyos) {
    // 現在の盤面をクリア
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
    
    // 消去対象のぷよをハイライト用のセット作成
    const erasedSet = new Set(erasedPuyos.map(p => `${p.x},${p.y}`));
    
    // プレビュー盤面の状態をメイン盤面に反映
    Stage.puyoCount = 0;
    for (let y = 0; y < Config.stageRows; y++) {
      for (let x = 0; x < Config.stageCols; x++) {
        const puyoType = board[y][x];
        if (puyoType >= 1 && puyoType <= 5) {
          Stage.setPuyo(x, y, puyoType);
          Stage.puyoCount++;
          
          // 消去対象のぷよは特別な表示にする
          const cell = Stage.board[y][x];
          if (cell && cell.element && erasedSet.has(`${x},${y}`)) {
            cell.element.style.filter = 'brightness(150%) saturate(150%)';
            cell.element.style.boxShadow = '0 0 10px rgba(255,0,0,0.8)';
            cell.element.style.animation = 'pulse 1s infinite';
          }
        }
      }
    }
    
    // アニメーション用CSSを動的に追加（まだ存在しない場合）
    if (!document.getElementById('preview-animation-style')) {
      const style = document.createElement('style');
      style.id = 'preview-animation-style';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// SideMenuクラスの連鎖プレビューとステップ連鎖機能を更新
SideMenu.startChainPreview = function() {
  // Ver.1.9で変更: 通常プレイ時はモーダルプレビューを使用
  ChainPreview.startPreview('modal');
};

SideMenu.startStepChain = function() {
  // Ver.1.9で変更: 通常プレイ時はモーダルプレビューを使用
  ChainPreview.startPreview('modal');
};