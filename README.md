# Rhythm Trainer GPT

リズム譜を見ながらタップして、タイミング判定を受けられる練習用プロトタイプです。

## 必要なもの

- Google Chrome、Microsoft Edge などのブラウザ
- Node.js 18 以上

Node.js が入っていない場合は、公式サイトから LTS 版を入れてください。

https://nodejs.org/

## ノートPCへ引き継ぐ方法

この `Rhythm-trainer-GPT` フォルダを丸ごと Google Drive で同期してください。

最低限必要なファイルは次の5つです。

- `index.html`
- `styles.css`
- `app.js`
- `server.js`
- `package.json`

## 起動方法

このフォルダをターミナルまたは PowerShell で開き、次を実行します。

```powershell
npm run dev
```

起動したら、ブラウザで次を開きます。

```text
http://127.0.0.1:5173/
```

## いま開けない場合

`npm run dev` が使えない場合でも、まずは `index.html` をブラウザで直接開けば画面確認はできます。

ただし、今後マイク、保存、外部素材などを使う機能を足す可能性があるなら、基本は `npm run dev` で起動するのがおすすめです。

## 現在入っている機能

- BPM 設定
- TAP テンポ
- START / STOP
- 4拍カウントイン
- Web Audio の先読み予約による均等なクリック
- リズム譜表示
- タップ判定
- スコア表示
- 練習スロット
- 2小節パターンの簡易エディタ
- カスタムパターン保存

## 開発メモ

音のタイミングは、画面更新タイマーではなく Web Audio の時刻指定で先読み予約しています。

リズム練習アプリではカウントとクリックの均等さが重要なので、音を鳴らす処理と画面表示の更新は分けています。

## GitHub公開予定

Claude Code版と区別するため、GitHubリポジトリ名は次を予定しています。

```text
tsg-rhythm-trainer-gpt
```

GitHub PagesのURL予定:

```text
https://tstylelab.github.io/tsg-rhythm-trainer-gpt/
```
