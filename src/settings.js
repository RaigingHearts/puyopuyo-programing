// Ver.1.14で追加: 設定UI機能
// ゲーム設定の管理とUI制御

let Settings = {
    settingsScreenElement: null,
    isSettingsOpen: false,
    
    // デフォルト設定値（Config.jsから取得）
    defaultSettings: {
        stageRows: 12,
        stageCols: 6,
        dropSpeed: 60,
        puyoColors: 4
    },
    
    // 現在の設定値
    currentSettings: {
        stageRows: 12,
        stageCols: 6,
        dropSpeed: 60,
        puyoColors: 4
    },
    
    // 初期化
    initialize: function() {
        this.loadDefaultSettings();
        this.loadSettingsFromCookie();
    },
    
    // デフォルト設定を読み込み
    loadDefaultSettings: function() {
        if (typeof Config !== 'undefined') {
            this.defaultSettings.stageRows = Config.stageRows || 12;
            this.defaultSettings.stageCols = Config.stageCols || 6;
            this.defaultSettings.dropSpeed = Config.dropSpeed || 60;
            this.defaultSettings.puyoColors = Config.puyoColors || 5;
            
            // 現在の設定もデフォルト値で初期化
            this.currentSettings = { ...this.defaultSettings };
        }
    },
    
    // クッキーから設定を読み込み
    loadSettingsFromCookie: function() {
        const savedSettings = this.getCookie('puyopuyo_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.currentSettings = { ...this.defaultSettings, ...parsed };
            } catch (e) {
                console.warn('設定の読み込みに失敗しました:', e);
            }
        }
    },
    
    // 設定をクッキーに保存
    saveSettingsToCookie: function() {
        const settingsJson = JSON.stringify(this.currentSettings);
        this.setCookie('puyopuyo_settings', settingsJson, 365);
    },
    
    // 設定画面を作成
    createSettingsScreen: function() {
        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'settings-screen';
        settingsContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            font-family: Arial, sans-serif;
        `;
        
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            background: white;
            border-radius: 10px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // タイトル
        const title = document.createElement('h2');
        title.textContent = '⚙️ ゲーム設定';
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #2c3e50;
            text-align: center;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        `;
        
        // 設定項目を作成
        const settingsForm = document.createElement('div');
        
        // ステージグリッド設定
        const gridSection = this.createSettingSection(
            '🎮 ステージグリッド',
            [
                { label: '横のマス数', key: 'stageCols', min: 4, max: 10, step: 1 },
                { label: '縦のマス数', key: 'stageRows', min: 8, max: 20, step: 1 }
            ]
        );
        
        // 落下速度設定
        const speedSection = this.createSettingSection(
            '⚡ 落下速度',
            [
                { label: '落下フレーム数', key: 'dropSpeed', min: 10, max: 120, step: 5, 
                  description: '小さいほど高速（上級者向け）' }
            ]
        );
        
        // ぷよ色数設定
        const colorSection = this.createSettingSection(
            '🌈 ぷよの色数',
            [
                { label: '使用する色数', key: 'puyoColors', min: 3, max: 5, step: 1,
                  description: '多いほど高難度' }
            ]
        );
        
        settingsForm.appendChild(gridSection);
        settingsForm.appendChild(speedSection);
        settingsForm.appendChild(colorSection);
        
        // ボタン群
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            gap: 10px;
        `;
        
        const resetButton = this.createButton('🔄 デフォルトに戻す', '#e74c3c', () => {
            this.resetToDefault();
        });
        
        const cancelButton = this.createButton('❌ キャンセル', '#95a5a6', () => {
            this.closeSettings();
        });
        
        const saveButton = this.createButton('💾 保存して適用', '#27ae60', () => {
            this.saveAndApplySettings();
        });
        
        buttonContainer.appendChild(resetButton);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        
        // 組み立て
        settingsPanel.appendChild(title);
        settingsPanel.appendChild(settingsForm);
        settingsPanel.appendChild(buttonContainer);
        settingsContainer.appendChild(settingsPanel);
        
        this.settingsScreenElement = settingsContainer;
        return settingsContainer;
    },
    
    // 設定セクションを作成
    createSettingSection: function(title, settings) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        `;
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = title;
        sectionTitle.style.cssText = `
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 1.1em;
        `;
        section.appendChild(sectionTitle);
        
        settings.forEach(setting => {
            const settingRow = document.createElement('div');
            settingRow.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                justify-content: space-between;
            `;
            
            const label = document.createElement('label');
            label.textContent = setting.label;
            label.style.cssText = `
                font-weight: bold;
                min-width: 120px;
                color: #34495e;
            `;
            
            const inputContainer = document.createElement('div');
            inputContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.min = setting.min;
            input.max = setting.max;
            input.step = setting.step;
            input.value = this.currentSettings[setting.key];
            input.style.cssText = `
                width: 150px;
            `;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = this.currentSettings[setting.key];
            valueDisplay.style.cssText = `
                min-width: 30px;
                font-weight: bold;
                color: #2c3e50;
            `;
            
            input.addEventListener('input', () => {
                valueDisplay.textContent = input.value;
                this.currentSettings[setting.key] = parseInt(input.value);
            });
            
            inputContainer.appendChild(input);
            inputContainer.appendChild(valueDisplay);
            
            settingRow.appendChild(label);
            settingRow.appendChild(inputContainer);
            
            section.appendChild(settingRow);
            
            // 説明文があれば追加
            if (setting.description) {
                const description = document.createElement('div');
                description.textContent = setting.description;
                description.style.cssText = `
                    font-size: 0.8em;
                    color: #7f8c8d;
                    margin-left: 120px;
                    margin-bottom: 10px;
                `;
                section.appendChild(description);
            }
        });
        
        return section;
    },
    
    // ボタンを作成
    createButton: function(text, color, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            background: ${color};
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: opacity 0.3s;
            flex: 1;
        `;
        
        button.addEventListener('mouseover', () => {
            button.style.opacity = '0.8';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.opacity = '1';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    },
    
    // 設定画面を表示
    showSettings: function() {
        if (!this.settingsScreenElement) {
            document.body.appendChild(this.createSettingsScreen());
        }
        this.settingsScreenElement.style.display = 'flex';
        this.isSettingsOpen = true;
    },
    
    // 設定画面を非表示
    closeSettings: function() {
        if (this.settingsScreenElement) {
            this.settingsScreenElement.style.display = 'none';
        }
        this.isSettingsOpen = false;
        
        // 変更を破棄して元の値に戻す
        this.loadSettingsFromCookie();
    },
    
    // デフォルトに戻す
    resetToDefault: function() {
        this.currentSettings = { ...this.defaultSettings };
        this.updateSettingsInputs();
    },
    
    // 設定入力値を更新
    updateSettingsInputs: function() {
        if (!this.settingsScreenElement) return;
        
        const inputs = this.settingsScreenElement.querySelectorAll('input[type="range"]');
        inputs.forEach(input => {
            const key = this.getSettingKeyFromInput(input);
            if (key && this.currentSettings[key] !== undefined) {
                input.value = this.currentSettings[key];
                const valueDisplay = input.parentElement.querySelector('span');
                if (valueDisplay) {
                    valueDisplay.textContent = this.currentSettings[key];
                }
            }
        });
    },
    
    // 入力要素から設定キーを取得
    getSettingKeyFromInput: function(input) {
        // 簡単な実装: 親要素のラベルテキストから推測
        const label = input.closest('div').querySelector('label');
        if (label) {
            const text = label.textContent;
            if (text.includes('横のマス数')) return 'stageCols';
            if (text.includes('縦のマス数')) return 'stageRows';
            if (text.includes('落下フレーム数')) return 'dropSpeed';
            if (text.includes('使用する色数')) return 'puyoColors';
        }
        return null;
    },
    
    // 設定を保存して適用
    saveAndApplySettings: function() {
        this.saveSettingsToCookie();
        this.applySettings();
        this.closeSettings();
        
        // 設定適用後、ゲームを再初期化
        if (typeof Game !== 'undefined' && StartScreen.isGameStarted) {
            this.reinitializeGame();
        }
        
        alert('設定が保存されました！');
    },
    
    // 設定をゲームに適用
    applySettings: function() {
        if (typeof Config !== 'undefined') {
            Config.stageRows = this.currentSettings.stageRows;
            Config.stageCols = this.currentSettings.stageCols;
            Config.dropSpeed = this.currentSettings.dropSpeed;
            Config.puyoColors = this.currentSettings.puyoColors;
            
            // Ver.1.14で追加: グリッドサイズ変更時にぷよサイズを再計算
            Config.calculatePuyoSize();
            
            // Ver.1.14で追加: 可変グリッド対応 - 演出画像のサイズも更新
            this.updateEffectImageSizes();
        }
    },
    
    // Ver.1.14で修正: 演出画像のサイズを実際の盤面サイズに更新
    updateEffectImageSizes: function() {
        // 全消し演出画像のサイズ更新（実際の盤面サイズに合わせる）
        const zenkeshiImage = document.getElementById('zenkeshi');
        if (zenkeshiImage) {
            zenkeshiImage.width = Config.puyoImgWidth * Config.stageCols;
        }
        
        // ばたんきゅー演出画像のサイズ更新（実際の盤面サイズに合わせる）
        const batankyuImage = document.getElementById('batankyu');
        if (batankyuImage) {
            batankyuImage.width = Config.puyoImgWidth * Config.stageCols;
        }
    },
    
    // ゲームを再初期化
    reinitializeGame: function() {
        // Ver.1.14で修正: 安全な再初期化のためページリロードを使用
        if (confirm('設定を適用するためにページを再読み込みします。よろしいですか？')) {
            // 少し待ってからリロード（設定保存完了を確保）
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    },
    
    // クッキー操作
    setCookie: function(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    },
    
    getCookie: function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
};