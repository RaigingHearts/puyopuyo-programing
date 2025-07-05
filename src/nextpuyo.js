// Ver.1.1で追加: NEXTぷよ管理クラス
class NextPuyo {
  static initialize() {
    // NEXTぷよ表示エリアの要素を取得
    this.nextPuyo1Element = document.getElementById('next-puyo-1');
    this.nextPuyo2Element = document.getElementById('next-puyo-2');
    
    // NEXTぷよのキューを初期化（2つ先まで）
    this.nextPuyoQueue = [];
    
    // 初期のNEXTぷよを生成
    this.generateNextPuyos();
    
    // NEXTぷよの表示を更新
    this.updateDisplay();
  }
  
  // NEXTぷよを生成する
  static generateNextPuyos() {
    // キューが空の場合は2つ分生成
    while (this.nextPuyoQueue.length < 2) {
      const puyoColors = Math.max(1, Math.min(5, Config.puyoColors));
      const centerPuyo = Math.floor(Math.random() * puyoColors) + 1;
      const movablePuyo = Math.floor(Math.random() * puyoColors) + 1;
      
      this.nextPuyoQueue.push({
        center: centerPuyo,
        movable: movablePuyo
      });
    }
  }
  
  // 次のぷよを取得（キューから取り出し）
  static getNextPuyo() {
    if (this.nextPuyoQueue.length === 0) {
      // キューが空の場合は新しく生成
      this.generateNextPuyos();
    }
    
    const nextPuyo = this.nextPuyoQueue.shift();
    
    // 新しいぷよをキューに追加
    this.generateNextPuyos();
    
    // 表示を更新
    this.updateDisplay();
    
    return nextPuyo;
  }
  
  // NEXTぷよの表示を更新
  static updateDisplay() {
    // 既存の表示をクリア
    this.clearDisplay();
    
    // NEXT 1（次のぷよ）を表示
    if (this.nextPuyoQueue.length > 0) {
      this.displayNextPuyo(this.nextPuyo1Element, this.nextPuyoQueue[0], 0.8);
    }
    
    // NEXT 2（2つ先のぷよ）を表示
    if (this.nextPuyoQueue.length > 1) {
      this.displayNextPuyo(this.nextPuyo2Element, this.nextPuyoQueue[1], 0.8);
    }
  }
  
  // 指定されたエリアにNEXTぷよを表示
  static displayNextPuyo(containerElement, puyoInfo, scale) {
    // 中心ぷよを表示
    const centerPuyoImg = PuyoImage.getPuyo(puyoInfo.center);
    centerPuyoImg.width = Config.puyoImgWidth * scale;
    centerPuyoImg.height = Config.puyoImgHeight * scale;
    centerPuyoImg.style.position = 'absolute';
    // Ver.1.4で変更: 位置を3%縮小に合わせて調整（20px → 19px、40px → 39px）
    // RaigingHeartsによるさらなる調整: （left:15 top:30）
    centerPuyoImg.style.left = '15px';
    centerPuyoImg.style.top = '30px';
    containerElement.appendChild(centerPuyoImg);
    
    // 動くぷよを表示（上に配置）
    const movablePuyoImg = PuyoImage.getPuyo(puyoInfo.movable);
    movablePuyoImg.width = Config.puyoImgWidth * scale;
    movablePuyoImg.height = Config.puyoImgHeight * scale;
    movablePuyoImg.style.position = 'absolute';
    // Ver.1.4で変更: 位置を3%縮小に合わせて調整（20px → 19px、8pxは変更なし）
    // RaigingHeartsによるさらなる調整: （left:15 top:0）
    movablePuyoImg.style.left = '15px';
    movablePuyoImg.style.top = '0px';
    containerElement.appendChild(movablePuyoImg);
  }
  
  // 表示をクリア
  static clearDisplay() {
    while (this.nextPuyo1Element.firstChild) {
      this.nextPuyo1Element.removeChild(this.nextPuyo1Element.firstChild);
    }
    while (this.nextPuyo2Element.firstChild) {
      this.nextPuyo2Element.removeChild(this.nextPuyo2Element.firstChild);
    }
  }
}