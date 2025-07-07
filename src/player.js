class Player {
  // static centerPuyo;
  // static movablePuyo;
  // static puyoStatus;
  // static centerPuyoElement;
  // static movablePuyoElement;
  // static groundFrame;
  // static keyStatus;
  // static actionStartFrame;
  // static moveSource;
  // static moveDestination;
  // static rotateBeforeLeft;
  // static rotateAfterLeft;
  // static rotateFromRotation;
  static initialize() {
    // Ver.1.2で変更: キーボードの入力を確認する（AキーとDキーを追加）
    this.keyStatus = {
      right: false,
      left: false,
      up: false,
      down: false,
      a: false,  // Ver.1.2で追加: 左回り回転
      d: false,  // Ver.1.2で追加: 右回り回転
      space: false  // Ver.1.8で追加: スペースキー（ばたんきゅー後のリロード用）
    };
    // Ver.1.8で追加: 落下コントロールボタンの状態管理
    this.fallControlStatus = false;
    // ブラウザのキーボードの入力を取得するイベントリスナを登録する
    document.addEventListener('keydown', (e) => {
      // キーボードが押された場合
      switch (e.keyCode) {
        case 37: // 左向きキー
          this.keyStatus.left = true;
          e.preventDefault();
          return false;
        case 38: // Ver.1.2で変更: 上向きキー（回転 → 落下ストップ）
          this.keyStatus.up = true;
          e.preventDefault();
          return false;
        case 39: // 右向きキー
          this.keyStatus.right = true;
          e.preventDefault();
          return false;
        case 40: // 下向きキー
          this.keyStatus.down = true;
          e.preventDefault();
          return false;
        case 65: // Ver.1.2で追加: Aキー（左回り回転）
          this.keyStatus.a = true;
          e.preventDefault();
          return false;
        case 68: // Ver.1.2で追加: Dキー（右回り回転）
          this.keyStatus.d = true;
          e.preventDefault();
          return false;
        case 32: // Ver.1.8で追加: スペースキー（ばたんきゅー後のリロード用）
          this.keyStatus.space = true;
          e.preventDefault();
          return false;
      }
    });
    document.addEventListener('keyup', (e) => {
      // キーボードが離された場合
      switch (e.keyCode) {
        case 37: // 左向きキー
          this.keyStatus.left = false;
          e.preventDefault();
          return false;
        case 38: // Ver.1.2で変更: 上向きキー（回転 → 落下ストップ）
          this.keyStatus.up = false;
          e.preventDefault();
          return false;
        case 39: // 右向きキー
          this.keyStatus.right = false;
          e.preventDefault();
          return false;
        case 40: // 下向きキー
          this.keyStatus.down = false;
          e.preventDefault();
          return false;
        case 65: // Ver.1.2で追加: Aキー（左回り回転）
          this.keyStatus.a = false;
          e.preventDefault();
          return false;
        case 68: // Ver.1.2で追加: Dキー（右回り回転）
          this.keyStatus.d = false;
          e.preventDefault();
          return false;
        case 32: // Ver.1.8で追加: スペースキー（ばたんきゅー後のリロード用）
          this.keyStatus.space = false;
          e.preventDefault();
          return false;
      }
    });
    // タッチ操作追加
    this.touchPoint = {
      xs: 0,
      ys: 0,
      xe: 0,
      ye: 0
    }
    document.addEventListener('touchstart', (e) => {
      this.touchPoint.xs = e.touches[0].clientX
      this.touchPoint.ys = e.touches[0].clientY
    })
    document.addEventListener('touchmove', (e) => {
      // 指が少し動いた時は無視
      if (Math.abs(e.touches[0].clientX - this.touchPoint.xs) < 20 &&
        Math.abs(e.touches[0].clientY - this.touchPoint.ys) < 20
      ) {
        return
      }
      // 指の動きをからジェスチャーによるkeyStatusプロパティを更新
      this.touchPoint.xe = e.touches[0].clientX
      this.touchPoint.ye = e.touches[0].clientY
      const {
        xs,
        ys,
        xe,
        ye
      } = this.touchPoint
      gesture(xs, ys, xe, ye)
      this.touchPoint.xs = this.touchPoint.xe
      this.touchPoint.ys = this.touchPoint.ye
    })
    document.addEventListener('touchend', (e) => {
      this.keyStatus.up = false
      this.keyStatus.down = false
      this.keyStatus.left = false
      this.keyStatus.right = false
      // Ver.1.2で追加: AキーとDキーの状態もリセット
      this.keyStatus.a = false
      this.keyStatus.d = false
      // Ver.1.8で追加: スペースキーの状態もリセット
      this.keyStatus.space = false
    })
    // ジェスチャーを判定して、keyStatusプロパティを更新する関数
    const gesture = (xs, ys, xe, ye) => {
      const horizonDirection = xe - xs;
      const verticalDirection = ye - ys;
      if (Math.abs(horizonDirection) < Math.abs(verticalDirection)) {
        // 縦方向
        if (verticalDirection < 0) {
          // up
          this.keyStatus.up = true
          this.keyStatus.down = false
          this.keyStatus.left = false
          this.keyStatus.right = false
        } else if (0 <= verticalDirection) {
          // down
          this.keyStatus.up = false
          this.keyStatus.down = true
          this.keyStatus.left = false
          this.keyStatus.right = false
        }
      } else {
        // 横方向
        if (horizonDirection < 0) {
          // left
          this.keyStatus.up = false
          this.keyStatus.down = false
          this.keyStatus.left = true
          this.keyStatus.right = false
        } else if (0 <= horizonDirection) {
          // right
          this.keyStatus.up = false
          this.keyStatus.down = false
          this.keyStatus.left = false
          this.keyStatus.right = true
        }
      }
    }
  }
  //ぷよ設置確認
  static createNewPuyo() {
    // ぷよぷよが置けるかどうか、1番上の段の左から3つ目を確認する
    if (Stage.board[0][2]) {
      // 空白でない場合は新しいぷよを置けない
      return false;
    }
    // Ver.1.1で変更: NEXTぷよシステムから新しいぷよの色を取得する
    // 従来のランダム生成方式（コメントアウト）
    // const puyoColors = Math.max(1, Math.min(5, Config.puyoColors));
    // this.centerPuyo = Math.floor(Math.random() * puyoColors) + 1;
    // this.movablePuyo = Math.floor(Math.random() * puyoColors) + 1;
    
    // NEXTぷよシステムから次のぷよを取得
    const nextPuyo = NextPuyo.getNextPuyo();
    this.centerPuyo = nextPuyo.center;
    this.movablePuyo = nextPuyo.movable;
    // 新しいぷよ画像を作成する
    this.centerPuyoElement = PuyoImage.getPuyo(this.centerPuyo);
    this.movablePuyoElement = PuyoImage.getPuyo(this.movablePuyo);
    Stage.stageElement.appendChild(this.centerPuyoElement);
    Stage.stageElement.appendChild(this.movablePuyoElement);
    
    // Ver.1.5で追加: 幽霊ぷよ画像を作成する
    this.ghostCenterPuyoElement = PuyoImage.getPuyo(this.centerPuyo);
    this.ghostMovablePuyoElement = PuyoImage.getPuyo(this.movablePuyo);
    // 幽霊ぷよの透明度を設定
    this.ghostCenterPuyoElement.style.opacity = Config.ghostPuyoOpacity;
    this.ghostMovablePuyoElement.style.opacity = Config.ghostPuyoOpacity;
    // 幽霊ぷよをステージに追加
    Stage.stageElement.appendChild(this.ghostCenterPuyoElement);
    Stage.stageElement.appendChild(this.ghostMovablePuyoElement);
    // ぷよの初期配置を定める
    this.puyoStatus = {
      x: 2, // 中心ぷよの位置: 左から2列目
      y: -1, // 画面上部ギリギリから出てくる
      left: 2 * Config.puyoImgWidth,
      top: -1 * Config.puyoImgHeight,
      dx: 0, // 動くぷよの相対位置: 動くぷよは上方向にある
      dy: -1,
      rotation: 90 // 動くぷよの角度は90度（上向き）
    };
    // 接地時間はゼロ
    this.groundFrame = 0;
    // ぷよを描画
    this.setPuyoPosition();
    // Ver.1.5で追加: 初期の幽霊ぷよ位置を設定
    this.updateGhostPuyo();
    return true;
  }
  static setPuyoPosition() {
    this.centerPuyoElement.style.left = this.puyoStatus.left + 'px';
    this.centerPuyoElement.style.top = this.puyoStatus.top + 'px';
    const x = this.puyoStatus.left + Math.cos(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgWidth;
    const y = this.puyoStatus.top - Math.sin(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgHeight;
    this.movablePuyoElement.style.left = x + 'px';
    this.movablePuyoElement.style.top = y + 'px';
    
    // Ver.1.5で追加: 幽霊ぷよの位置も更新
    this.updateGhostPuyo();
  }
  
  // Ver.1.5で追加: 幽霊ぷよの着地点を計算する
  static calculateGhostPosition() {
    const currentX = this.puyoStatus.x;
    const currentY = this.puyoStatus.y;
    const dx = this.puyoStatus.dx;
    const dy = this.puyoStatus.dy;
    
    // 現在の位置から下方向に障害物がないかチェックしながら着地点を探す
    let ghostY = currentY;
    
    // 下方向に落下シミュレーション
    while (ghostY < Config.stageRows) {
      // 次の位置をチェック
      const nextY = ghostY + 1;
      
      // 中心ぷよが障害物に当たるかチェック
      if (nextY >= Config.stageRows || Stage.board[nextY][currentX]) {
        break;
      }
      
      // 動くぷよが障害物に当たるかチェック
      const movableX = currentX + dx;
      const movableY = nextY + dy;
      if (movableY >= 0) { // 画面内の場合のみチェック
        if (movableY >= Config.stageRows || movableX < 0 || movableX >= Config.stageCols || Stage.board[movableY][movableX]) {
          break;
        }
      }
      
      ghostY = nextY;
    }
    
    return ghostY;
  }
  
  // Ver.1.5で追加: 幽霊ぷよの表示位置を更新する
  static updateGhostPuyo() {
    if (!this.ghostCenterPuyoElement || !this.ghostMovablePuyoElement) {
      return;
    }
    
    const ghostY = this.calculateGhostPosition();
    const currentX = this.puyoStatus.x;
    const dx = this.puyoStatus.dx;
    const dy = this.puyoStatus.dy;
    
    // 幽霊ぷよの位置を設定
    const ghostCenterLeft = currentX * Config.puyoImgWidth;
    const ghostCenterTop = ghostY * Config.puyoImgHeight;
    
    this.ghostCenterPuyoElement.style.left = ghostCenterLeft + 'px';
    this.ghostCenterPuyoElement.style.top = ghostCenterTop + 'px';
    
    // 動く幽霊ぷよの位置を計算
    const ghostMovableLeft = ghostCenterLeft + Math.cos(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgWidth;
    const ghostMovableTop = ghostCenterTop - Math.sin(this.puyoStatus.rotation * Math.PI / 180) * Config.puyoImgHeight;
    
    this.ghostMovablePuyoElement.style.left = ghostMovableLeft + 'px';
    this.ghostMovablePuyoElement.style.top = ghostMovableTop + 'px';
  }
  static falling(isDownPressed, isStopPressed) {
    // Ver.1.2で変更: 上矢印キーが押されている間は落下を停止
    // Ver.1.8で変更: 上矢印キーまたは落下コントロールボタンで落下を停止
    if (isStopPressed || this.fallControlStatus) {
      // 上矢印キーまたは落下コントロールボタンが押されている間は落下を停止する
      return;
    }
    
    // 現状の場所の下にブロックがあるかどうか確認する
    let isBlocked = false;
    let x = this.puyoStatus.x;
    let y = this.puyoStatus.y;
    let dx = this.puyoStatus.dx;
    let dy = this.puyoStatus.dy;
    if (y + 1 >= Config.stageRows || Stage.board[y + 1][x] || (y + dy + 1 >= 0 && (y + dy + 1 >= Config.stageRows ||
        Stage.board[y + dy + 1][x + dx]))) {
      isBlocked = true;
    }
    if (!isBlocked) {
      // 下にブロックがないなら自由落下してよい。プレイヤー操作中の自由落下処理をする
      this.puyoStatus.top += Config.playerFallingSpeed;
      if (isDownPressed) {
        // 下キーが押されているならもっと加速する
        this.puyoStatus.top += Config.playerDownSpeed;
      }
      if (Math.floor(this.puyoStatus.top / Config.puyoImgHeight) != y) {
        // ブロックの境を超えたので、再チェックする
        // 下キーが押されていたら、得点を加算する
        if (isDownPressed) {
          Score.addScore(1);
        }
        y += 1;
        this.puyoStatus.y = y;
        if (y + 1 >= Config.stageRows || Stage.board[y + 1][x] || (y + dy + 1 >= 0 && (y + dy + 1 >= Config.stageRows || Stage.board[y + dy + 1][x + dx]))) {
          isBlocked = true;
        }
        if (!isBlocked) {
          // 境を超えたが特に問題はなかった。次回も自由落下を続ける
          this.groundFrame = 0;
          return;
        } else {
          // 境を超えたらブロックにぶつかった。位置を調節して、接地を開始する
          this.puyoStatus.top = y * Config.puyoImgHeight;
          this.groundFrame = 1;
          return;
        }
      } else {
        // 自由落下で特に問題がなかった。次回も自由落下を続ける
        this.groundFrame = 0;
        return;
      }
    }
    if (this.groundFrame == 0) {
      // 初接地である。接地を開始する
      this.groundFrame = 1;
      return;
    } else {
      this.groundFrame++;
      if (this.groundFrame > Config.playerGroundFrame) {
        return true;
      }
    }
  }
  static playing(frame) {
    // Ver.1.2で変更: 自由落下を確認する（上矢印キーでストップ機能追加）
    // 下キーが押されていた場合、それ込みで自由落下させる
    // 上矢印キーが押されている場合は落下を停止する
    if (this.falling(this.keyStatus.down, this.keyStatus.up)) {
      // 落下が終わっていたら、ぷよを固定する
      this.setPuyoPosition();
      return 'fix';
    }
    this.setPuyoPosition();
    if (this.keyStatus.right || this.keyStatus.left) {
      // 左右の確認をする
      const cx = (this.keyStatus.right) ? 1 : -1;
      const x = this.puyoStatus.x;
      const y = this.puyoStatus.y;
      const mx = x + this.puyoStatus.dx;
      const my = y + this.puyoStatus.dy;
      // その方向にブロックがないことを確認する
      // まずは自分の左右を確認
      let canMove = true;
      if (y < 0 || x + cx < 0 || x + cx >= Config.stageCols || Stage.board[y][x + cx]) {
        if (y >= 0) {
          canMove = false;
        }
      }
      if (my < 0 || mx + cx < 0 || mx + cx >= Config.stageCols || Stage.board[my][mx + cx]) {
        if (my >= 0) {
          canMove = false;
        }
      }
      // 接地していない場合は、さらに1個下のブロックの左右も確認する
      if (this.groundFrame === 0) {
        if (y + 1 < 0 || x + cx < 0 || x + cx >= Config.stageCols || Stage.board[y + 1][x + cx]) {
          if (y + 1 >= 0) {
            canMove = false;
          }
        }
        if (my + 1 < 0 || mx + cx < 0 || mx + cx >= Config.stageCols || Stage.board[my + 1][mx + cx]) {
          if (my + 1 >= 0) {
            canMove = false;
          }
        }
      }
      if (canMove) {
        // 動かすことが出来るので、移動先情報をセットして移動状態にする
        this.actionStartFrame = frame;
        this.moveSource = x * Config.puyoImgWidth;
        this.moveDestination = (x + cx) * Config.puyoImgWidth;
        this.puyoStatus.x += cx;
        return 'moving';
      }
    } else if (this.keyStatus.a || this.keyStatus.d) {
      // Ver.1.2で変更: 回転を確認する（Aキー: 左回り、Dキー: 右回り）
      const isClockwise = this.keyStatus.d; // Dキーが押されている場合は右回り（時計回り）
      const rotationDirection = isClockwise ? -90 : 90; // 右回りは-90度、左回りは+90度
      
      // 回せるかどうかは後で確認。まわすぞ
      const x = this.puyoStatus.x;
      const y = this.puyoStatus.y;
      const mx = x + this.puyoStatus.dx;
      const my = y + this.puyoStatus.dy;
      const rotation = this.puyoStatus.rotation;
      let canRotate = true;
      let cx = 0;
      let cy = 0;
      
      // 回転後の角度を計算
      const nextRotation = (rotation + rotationDirection + 360) % 360;
      
      if (nextRotation === 0) {
        // 右から上には100% 確実に回せる。何もしない
      } else if (nextRotation === 90) {
        // 上から左に回すときに、左にブロックがあれば右に移動する必要があるのでまず確認する
        if (y + 1 < 0 || x - 1 < 0 || x - 1 >= Config.stageCols || Stage.board[y + 1][x - 1]) {
          if (y + 1 >= 0) {
            // ブロックがある。右に1個ずれる
            cx = 1;
          }
        }
        // 右にずれる必要がある時、右にもブロックがあれば回転出来ないので確認する
        if (cx === 1) {
          if (y + 1 < 0 || x + 1 < 0 || y + 1 >= Config.stageRows || x + 1 >= Config.stageCols || Stage.board[y + 1][x + 1]) {
            if (y + 1 >= 0) {
              // ブロックがある。回転出来なかった
              canRotate = false;
            }
          }
        }
      } else if (nextRotation === 180) {
        // 左から下に回す時には、自分の下か左下にブロックがあれば1個上に引き上げる。まず下を確認する
        if (y + 2 < 0 || y + 2 >= Config.stageRows || Stage.board[y + 2][x]) {
          if (y + 2 >= 0) {
            // ブロックがある。上に引き上げる
            cy = -1;
          }
        }
        // 左下も確認する
        if (y + 2 < 0 || y + 2 >= Config.stageRows || x - 1 < 0 || Stage.board[y + 2][x - 1]) {
          if (y + 2 >= 0) {
            // ブロックがある。上に引き上げる
            cy = -1;
          }
        }
      } else if (nextRotation === 270) {
        // 下から右に回すときは、右にブロックがあれば左に移動する必要があるのでまず確認する
        if (y + 1 < 0 || x + 1 < 0 || x + 1 >= Config.stageCols || Stage.board[y + 1][x + 1]) {
          if (y + 1 >= 0) {
            // ブロックがある。左に1個ずれる
            cx = -1;
          }
        }
        // 左にずれる必要がある時、左にもブロックがあれば回転出来ないので確認する
        if (cx === -1) {
          if (y + 1 < 0 || x - 1 < 0 || x - 1 >= Config.stageCols || Stage.board[y + 1][x - 1]) {
            if (y + 1 >= 0) {
              // ブロックがある。回転出来なかった
              canRotate = false;
            }
          }
        }
      }

      if (canRotate) {
        // 上に移動する必要があるときは、一気にあげてしまう
        if (cy === -1) {
          if (this.groundFrame > 0) {
            // 接地しているなら1段引き上げる
            this.puyoStatus.y -= 1;
            this.groundFrame = 0;
          }
          this.puyoStatus.top = this.puyoStatus.y * Config.puyoImgHeight;
        }
        // 回すことが出来るので、回転後の情報をセットして回転状態にする
        this.actionStartFrame = frame;
        this.rotateBeforeLeft = x * Config.puyoImgHeight;
        this.rotateAfterLeft = (x + cx) * Config.puyoImgHeight;
        this.rotateFromRotation = this.puyoStatus.rotation;
        this.rotateDirection = rotationDirection; // Ver.1.2で追加: 回転方向を記録
        // 次の状態を先に設定しておく
        this.puyoStatus.x += cx;
        const distRotation = nextRotation;
        const dCombi = [
          [1, 0],
          [0, -1],
          [-1, 0],
          [0, 1]
        ][distRotation / 90];
        this.puyoStatus.dx = dCombi[0];
        this.puyoStatus.dy = dCombi[1];
        return 'rotating';
      }
    }
    return 'playing';
  }
  static moving(frame) {
    // Ver.1.2で変更: 移動中も自然落下はさせる（上矢印キーでストップ対応）
    this.falling(false, this.keyStatus.up);
    const ratio = Math.min(1, (frame - this.actionStartFrame) / Config.playerMoveFrame);
    this.puyoStatus.left = ratio * (this.moveDestination - this.moveSource) + this.moveSource;
    this.setPuyoPosition();
    // Ver.1.5で追加: 移動中も幽霊ぷよを更新
    this.updateGhostPuyo();
    if (ratio === 1) {
      return false;
    }
    return true;
  }
  static rotating(frame) {
    // Ver.1.2で変更: 回転中も自然落下はさせる（上矢印キーでストップ対応）
    this.falling(false, this.keyStatus.up);
    const ratio = Math.min(1, (frame - this.actionStartFrame) / Config.playerRotateFrame);
    this.puyoStatus.left = (this.rotateAfterLeft - this.rotateBeforeLeft) * ratio + this.rotateBeforeLeft;
    // Ver.1.2で変更: 回転方向を考慮した回転計算
    this.puyoStatus.rotation = this.rotateFromRotation + ratio * this.rotateDirection;
    this.setPuyoPosition();
    // Ver.1.5で追加: 回転中も幽霊ぷよを更新
    this.updateGhostPuyo();
    if (ratio === 1) {
      this.puyoStatus.rotation = (this.rotateFromRotation + this.rotateDirection + 360) % 360;
      return false;
    }
    return true;
  }
  static fix() {
    // 現在のぷよをステージ上に配置する
    const x = this.puyoStatus.x;
    const y = this.puyoStatus.y;
    const dx = this.puyoStatus.dx;
    const dy = this.puyoStatus.dy;
    if (y >= 0) {
      // 画面外のぷよは消してしまう
      Stage.setPuyo(x, y, this.centerPuyo);
      Stage.puyoCount++;
    }
    if (y + dy >= 0) {
      // 画面外のぷよは消してしまう
      Stage.setPuyo(x + dx, y + dy, this.movablePuyo);
      Stage.puyoCount++;
    }
    // 操作用に作成したぷよ画像を消す
    Stage.stageElement.removeChild(this.centerPuyoElement);
    Stage.stageElement.removeChild(this.movablePuyoElement);
    this.centerPuyoElement = null;
    this.movablePuyoElement = null;
    
    // Ver.1.5で追加: 幽霊ぷよ画像も削除する
    if (this.ghostCenterPuyoElement) {
      Stage.stageElement.removeChild(this.ghostCenterPuyoElement);
      this.ghostCenterPuyoElement = null;
    }
    if (this.ghostMovablePuyoElement) {
      Stage.stageElement.removeChild(this.ghostMovablePuyoElement);
      this.ghostMovablePuyoElement = null;
    }
  }
  static batankyu() {
    // Ver.1.8で変更: 上矢印キーからスペースキーに変更
    if (this.keyStatus.space) {
      location.reload()
    }
  }
  
  // Ver.1.8で追加: 落下コントロールボタンの制御メソッド
  static toggleFallControl() {
    this.fallControlStatus = !this.fallControlStatus;
    this.updateFallControlButton();
  }
  
  static pauseFall() {
    this.fallControlStatus = true;
    this.updateFallControlButton();
  }
  
  static resumeFall() {
    this.fallControlStatus = false;
    this.updateFallControlButton();
  }
  
  static updateFallControlButton() {
    const pauseBtn = document.getElementById('pause-fall-btn');
    const resumeBtn = document.getElementById('resume-fall-btn');
    
    if (pauseBtn && resumeBtn) {
      if (this.fallControlStatus) {
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-block';
      } else {
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
      }
    }
  }
}