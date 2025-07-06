// Ver.1.6で追加: 連鎖プレビューとステップ連鎖機能管理クラス
class ChainPreview {
  static previewBoard = [];
  static previewElements = [];
  static chainSteps = [];
  static currentStep = 0;
  static isPreviewMode = false;
  
  // 連鎖プレビューを開始
  static startPreview() {
    if (this.isPreviewMode) {
      this.stopPreview();
      return;
    }
    
    this.isPreviewMode = true;
    this.currentStep = 0;
    this.copyBoardToPreview();
    this.chainSteps = [];
    
    // 連鎖をシミュレーション
    this.simulateChain();
    
    if (this.chainSteps.length === 0) {
      alert('連鎖が発生しません');
      this.isPreviewMode = false;
      return;
    }
    
    // プレビューUI作成
    this.createPreviewUI();
    this.showStep(0);
  }
  
  // 連鎖プレビューを停止
  static stopPreview() {
    this.isPreviewMode = false;
    this.clearPreviewElements();
    this.removePreviewUI();
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
    
    // 盤面の更新
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
    // TODO: 自動再生機能の実装
    alert('自動再生機能は実装予定です');
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
}

// SideMenuクラスの連鎖プレビューとステップ連鎖機能を更新
SideMenu.startChainPreview = function() {
  ChainPreview.startPreview();
};

SideMenu.startStepChain = function() {
  ChainPreview.startPreview();
};