// Ver.1.14で追加: 拡張フィールドコード機能
// 可変グリッド対応とデータ圧縮機能

let FieldCode = {
    // フィールドコードのバージョン識別子
    VERSION_HEADER: 'PF14', // Puyo Field version 1.4
    
    // 現在の盤面から拡張フィールドコードを生成
    generateExtendedCode: function() {
        // 設定情報を取得
        const settings = {
            stageCols: Config.stageCols,
            stageRows: Config.stageRows,
            puyoColors: Config.puyoColors,
            dropSpeed: Config.dropSpeed
        };
        
        // 盤面データを取得
        const boardData = this.getBoardData();
        
        // 拡張フォーマットでエンコード
        return this.encodeExtended(settings, boardData);
    },
    
    // 現在の盤面データを取得
    getBoardData: function() {
        const data = [];
        for (let y = 0; y < Config.stageRows; y++) {
            for (let x = 0; x < Config.stageCols; x++) {
                const cell = Stage.board[y] && Stage.board[y][x];
                if (cell && cell.puyo) {
                    data.push(cell.puyo);
                } else {
                    data.push(0);
                }
            }
        }
        return data;
    },
    
    // 拡張フォーマットでエンコード
    encodeExtended: function(settings, boardData) {
        // 設定情報をエンコード（4文字）
        const settingsCode = this.encodeSettings(settings);
        
        // 盤面データを圧縮エンコード
        const compressedBoard = this.compressBoardData(boardData);
        
        // フォーマット: VERSION_HEADER + 設定コード + 圧縮盤面データ
        return this.VERSION_HEADER + settingsCode + compressedBoard;
    },
    
    // 設定情報をエンコード（4文字）
    encodeSettings: function(settings) {
        // 各設定値を16進数1文字でエンコード
        const cols = Math.min(15, Math.max(4, settings.stageCols)).toString(16).toUpperCase();
        const rows = Math.min(15, Math.max(8, settings.stageRows - 8)).toString(16).toUpperCase(); // 8を基準値として差分
        const colors = Math.min(15, Math.max(3, settings.puyoColors)).toString(16).toUpperCase();
        const speed = Math.min(15, Math.floor(settings.dropSpeed / 10)).toString(16).toUpperCase();
        
        return cols + rows + colors + speed;
    },
    
    // 盤面データを圧縮
    compressBoardData: function(boardData) {
        // ランレングス圧縮を適用
        const compressed = this.runLengthEncode(boardData);
        
        // Base64風エンコード（0-9, A-Z, a-z, +, /）
        return this.base64Encode(compressed);
    },
    
    // ランレングス圧縮
    runLengthEncode: function(data) {
        const result = [];
        let currentValue = data[0];
        let count = 1;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i] === currentValue && count < 255) {
                count++;
            } else {
                result.push([currentValue, count]);
                currentValue = data[i];
                count = 1;
            }
        }
        result.push([currentValue, count]);
        
        return result;
    },
    
    // 簡易Base64エンコード
    base64Encode: function(runLengthData) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-';
        let result = '';
        
        for (const [value, count] of runLengthData) {
            // 値（0-5）と回数を組み合わせてエンコード
            const encoded = (value << 8) | count;
            
            // 2文字でエンコード
            result += chars[encoded >> 6] + chars[encoded & 63];
        }
        
        return result;
    },
    
    // 拡張フィールドコードから盤面を復元
    decodeExtended: function(code) {
        // バージョンヘッダーをチェック
        if (!code.startsWith(this.VERSION_HEADER)) {
            throw new Error('未対応のフィールドコード形式です');
        }
        
        // ヘッダーを除去
        const payload = code.substring(this.VERSION_HEADER.length);
        
        if (payload.length < 4) {
            throw new Error('フィールドコードが短すぎます');
        }
        
        // 設定情報をデコード
        const settingsCode = payload.substring(0, 4);
        const settings = this.decodeSettings(settingsCode);
        
        // 圧縮された盤面データをデコード
        const compressedData = payload.substring(4);
        const boardData = this.decompressBoardData(compressedData, settings);
        
        return {
            settings: settings,
            boardData: boardData
        };
    },
    
    // 設定情報をデコード
    decodeSettings: function(settingsCode) {
        const cols = parseInt(settingsCode[0], 16);
        const rows = parseInt(settingsCode[1], 16) + 8; // 基準値8を加算
        const colors = parseInt(settingsCode[2], 16);
        const speed = parseInt(settingsCode[3], 16) * 10;
        
        return {
            stageCols: cols,
            stageRows: rows,
            puyoColors: colors,
            dropSpeed: speed
        };
    },
    
    // 圧縮データを展開
    decompressBoardData: function(compressedData, settings) {
        // Base64デコード
        const runLengthData = this.base64Decode(compressedData);
        
        // ランレングス展開
        const boardData = this.runLengthDecode(runLengthData);
        
        // 想定サイズと一致するかチェック
        const expectedSize = settings.stageCols * settings.stageRows;
        if (boardData.length !== expectedSize) {
            throw new Error(`盤面データサイズが不正です (期待値: ${expectedSize}, 実際: ${boardData.length})`);
        }
        
        return boardData;
    },
    
    // 簡易Base64デコード
    base64Decode: function(encoded) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-';
        const charMap = {};
        for (let i = 0; i < chars.length; i++) {
            charMap[chars[i]] = i;
        }
        
        const result = [];
        for (let i = 0; i < encoded.length; i += 2) {
            const high = charMap[encoded[i]] || 0;
            const low = charMap[encoded[i + 1]] || 0;
            const encoded16 = (high << 6) | low;
            
            const value = (encoded16 >> 8) & 0xFF;
            const count = encoded16 & 0xFF;
            
            result.push([value, count]);
        }
        
        return result;
    },
    
    // ランレングス展開
    runLengthDecode: function(runLengthData) {
        const result = [];
        for (const [value, count] of runLengthData) {
            for (let i = 0; i < count; i++) {
                result.push(value);
            }
        }
        return result;
    },
    
    // 拡張フィールドコードから盤面を読み込み
    loadFromExtendedCode: function(code) {
        try {
            const decoded = this.decodeExtended(code);
            
            // 設定を適用
            this.applySettings(decoded.settings);
            
            // 盤面データを適用
            this.applyBoardData(decoded.boardData, decoded.settings);
            
            return true;
        } catch (error) {
            console.error('フィールドコード読み込みエラー:', error);
            alert('フィールドコードの読み込みに失敗しました: ' + error.message);
            return false;
        }
    },
    
    // 設定を適用
    applySettings: function(settings) {
        if (typeof Settings !== 'undefined') {
            Settings.currentSettings = { ...settings };
            Settings.applySettings();
        } else {
            // Settings.jsが読み込まれていない場合は直接適用
            Config.stageCols = settings.stageCols;
            Config.stageRows = settings.stageRows;
            Config.puyoColors = settings.puyoColors;
            Config.dropSpeed = settings.dropSpeed;
        }
    },
    
    // 盤面データを適用
    applyBoardData: function(boardData, settings) {
        // カスタム盤面データとして保存
        if (typeof SideMenu !== 'undefined') {
            SideMenu.customFieldData = {
                code: boardData.join(''),
                boardData: []
            };
            
            // 2次元配列に変換
            for (let y = 0; y < settings.stageRows; y++) {
                SideMenu.customFieldData.boardData[y] = [];
                for (let x = 0; x < settings.stageCols; x++) {
                    const index = y * settings.stageCols + x;
                    const puyoType = boardData[index] || 0;
                    SideMenu.customFieldData.boardData[y][x] = (puyoType >= 1 && puyoType <= 5) ? puyoType : 0;
                }
            }
            
            // ゲームを再初期化
            SideMenu.initializeGameLoop();
        }
    },
    
    // 従来形式との互換性チェック
    isLegacyFormat: function(code) {
        return !code.startsWith(this.VERSION_HEADER) && /^[0-5]+$/.test(code);
    },
    
    // 従来形式を拡張形式に変換
    upgradeLegacyCode: function(legacyCode) {
        // 標準的な6x12グリッドと仮定
        const settings = {
            stageCols: 6,
            stageRows: 12,
            puyoColors: 5,
            dropSpeed: 60
        };
        
        const boardData = legacyCode.split('').map(c => parseInt(c) || 0);
        return this.encodeExtended(settings, boardData);
    }
};