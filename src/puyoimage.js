class PuyoImage {
  // static puyoImages;
  // static batankyuImage;
  // static gameOverFrame;
  static initialize() {
    this.puyoImages = [];
    for (let i = 0; i < 5; i++) {
      const image = document.getElementById(`puyo_${i + 1}`);
      image.removeAttribute('id');
      image.width = Config.puyoImgWidth;
      image.height = Config.puyoImgHeight;
      image.style.position = 'absolute';
      this.puyoImages[i] = image;
    }
    this.batankyuImage = document.getElementById('batankyu');
    this.batankyuImage.width = Config.puyoImgWidth * 6;
    this.batankyuImage.style.position = 'absolute';
  }
  static getPuyo(index) {
    const image = this.puyoImages[index - 1].cloneNode(true);
    return image;
  }
  static prepareBatankyu(frame) {
    this.gameOverFrame = frame;
    Stage.stageElement.appendChild(this.batankyuImage);
    this.batankyuImage.style.top = -this.batankyuImage.height + 'px';
    
    // Ver.1.8で追加: コンティニューテキストを表示
    this.continueText = document.getElementById('continue-text');
    if (this.continueText) {
      this.continueText.style.display = 'block';
      Stage.stageElement.appendChild(this.continueText);
    }
  }
  static batankyu(frame) {
    const ratio = (frame - this.gameOverFrame) / Config.gameOverFrame;
    const x = Math.cos(Math.PI / 2 + ratio * Math.PI * 2 * 10) * Config.puyoImgWidth;
    const y = Math.cos(Math.PI + ratio * Math.PI * 2) * Config.puyoImgHeight * Config.stageRows / 4 + Config.
    puyoImgHeight * Config.stageRows / 2;
    this.batankyuImage.style.left = x + 'px';
    this.batankyuImage.style.top = y + 'px';
    
    // Ver.1.8で追加: コンティニューテキストの位置を調整
    if (this.continueText) {
      const textX = (Config.puyoImgWidth * Config.stageCols - this.continueText.offsetWidth) / 2;
      const textY = Config.puyoImgHeight * Config.stageRows - 100;
      this.continueText.style.left = textX + 'px';
      this.continueText.style.top = textY + 'px';
    }
  }
}