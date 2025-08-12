// Ver.1.14で追加: スタート画面機能
// ゲームスタート画面の管理と制御

let StartScreen = {
    isGameStarted: false,
    startScreenElement: null,
    
    // スタート画面の初期化
    initialize: function() {
        this.createStartScreen();
        this.setupEventListeners();
        this.showStartScreen();
    },
    
    // スタート画面のHTML要素を作成
    createStartScreen: function() {
        // スタート画面のコンテナを作成
        const startContainer = document.createElement('div');
        startContainer.id = 'start-screen';
        startContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            color: white;
            text-align: center;
        `;
        
        // タイトル
        const title = document.createElement('h1');
        title.textContent = 'ぷよぷよプログラミング';
        title.style.cssText = `
            font-size: 3em;
            margin-bottom: 0.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            animation: pulse 2s infinite;
        `;
        
        // バージョン情報
        const version = document.createElement('p');
        version.textContent = 'Ver.1.14';
        version.style.cssText = `
            font-size: 1.2em;
            margin-bottom: 2em;
            opacity: 0.8;
        `;
        
        // スタートメッセージ
        const startMessage = document.createElement('p');
        startMessage.textContent = 'スペースキーを押してゲームを開始';
        startMessage.style.cssText = `
            font-size: 1.5em;
            margin-bottom: 1em;
            padding: 15px 30px;
            border: 2px solid white;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            animation: blink 1.5s infinite;
        `;
        
        // 操作説明
        const controls = document.createElement('div');
        controls.innerHTML = `
            <p style="margin: 0.5em 0; font-size: 1.1em;">操作方法:</p>
            <p style="margin: 0.3em 0;">← → : 左右移動</p>
            <p style="margin: 0.3em 0;">↓ : 高速落下</p>
            <p style="margin: 0.3em 0;">Z : 左回転</p>
            <p style="margin: 0.3em 0;">X : 右回転</p>
        `;
        controls.style.cssText = `
            margin-top: 2em;
            font-size: 0.9em;
            opacity: 0.7;
            line-height: 1.4;
        `;
        
        // 設定ボタン
        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️ 設定';
        settingsButton.style.cssText = `
            margin-top: 2em;
            padding: 10px 20px;
            font-size: 1em;
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid white;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        settingsButton.addEventListener('mouseover', function() {
            this.style.background = 'rgba(255,255,255,0.3)';
        });
        settingsButton.addEventListener('mouseout', function() {
            this.style.background = 'rgba(255,255,255,0.2)';
        });
        settingsButton.addEventListener('click', function() {
            // Ver.1.14で実装: 設定画面を表示
            if (typeof Settings !== 'undefined') {
                Settings.showSettings();
            } else {
                alert('設定機能の読み込みに失敗しました');
            }
        });
        
        // CSS アニメーションを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
        
        // 要素を組み立て
        startContainer.appendChild(title);
        startContainer.appendChild(version);
        startContainer.appendChild(startMessage);
        startContainer.appendChild(controls);
        startContainer.appendChild(settingsButton);
        
        // DOMに追加
        document.body.appendChild(startContainer);
        this.startScreenElement = startContainer;
    },
    
    // イベントリスナーの設定
    setupEventListeners: function() {
        document.addEventListener('keydown', (event) => {
            if (!this.isGameStarted && event.code === 'Space') {
                event.preventDefault();
                this.startGame();
            }
        });
    },
    
    // スタート画面を表示
    showStartScreen: function() {
        if (this.startScreenElement) {
            this.startScreenElement.style.display = 'flex';
        }
    },
    
    // スタート画面を非表示
    hideStartScreen: function() {
        if (this.startScreenElement) {
            this.startScreenElement.style.display = 'none';
        }
    },
    
    // ゲーム開始
    startGame: function() {
        this.isGameStarted = true;
        this.hideStartScreen();
        
        // メインレイアウトとゲーム画面を表示状態にする
        const mainLayout = document.getElementById('main-layout');
        if (mainLayout) {
            mainLayout.style.display = 'flex';
        }
        
        // ゲーム本体を初期化・開始
        if (typeof Game !== 'undefined' && Game.initialize) {
            Game.initialize();
            Game.start();
        } else {
            // 従来の方式でゲーム開始
            initialize();
            loop();
        }
    },
    
    // ゲームに戻る（スタート画面から復帰）
    returnToGame: function() {
        if (this.isGameStarted) {
            this.hideStartScreen();
        }
    }
};
};