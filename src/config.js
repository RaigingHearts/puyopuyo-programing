// 設定を記載しておくクラス
class Config {
}
Config.puyoImgWidth = 40; // ぷよぷよ画像の幅
Config.puyoImgHeight = 40; // ぷよぷよ画像の高さ
Config.fontHeight = 33;
Config.stageCols = 6; // ステージの横の個数
Config.stageRows = 12; // ステージの縦の個数
// フィールドサイズ追加
// 高さが全部入るように調整
// Ver.1.4で変更: 盤面サイズを3%縮小（0.97倍）
// RaigingHeartsによるさらなる調整: （デフォルト:1.0から0.85倍へ縮小）
Config.puyoImgHeight = (window.innerHeight-Config.fontHeight)/Config.stageRows * 0.85
Config.puyoImgWidth = Config.puyoImgHeight;
Config.stageBackgroundColor = '#ffffff'; // ステージの背景色
Config.scoreBackgroundColor = '#24c0bb'; // スコアの背景色
Config.freeFallingSpeed = 16; // 自由落下のスピード
Config.erasePuyoCount = 4; // 何個以上揃ったら消えるか
Config.eraseAnimationDuration = 30; // 何フレームでぷよを消すか
Config.puyoColors = 5; // 何色のぷよを使うか
Config.playerFallingSpeed = 0.9; // プレイ中の自然落下のスピード
Config.playerDownSpeed = 10; // プレイ中の下キー押下時の落下スピード
Config.playerGroundFrame = 20; // 何フレーム接地したらぷよを固定するか
Config.playerMoveFrame = 10; // 左右移動に消費するフレーム数
Config.playerRotateFrame = 10; // 回転に消費するフレーム数
Config.zenkeshiDuration = 150; // 全消し時のアニメーションミリセカンド
Config.gameOverFrame = 3000; // ゲームオーバー演出のサイクルフレーム