export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold">📖 ゲームルール</h2>
          <button
            onClick={onClose}
            className="text-4xl hover:text-red-500 transition"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* ルール1: 各陣営の役職と能力 */}
          <section>
            <h3 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
              各陣営の役職と能力
            </h3>

            {/* キラ陣営 */}
            <div className="mb-6">
              <h4 className="text-xl font-bold text-red-500 mb-3">🔴 キラ陣営</h4>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <p className="font-bold text-lg mb-2">キラ</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>「デスノート」の番号を変更できる</li>
                  <li>裁きの時間に必ずプレイヤーを1人殺害する（カード所持時）</li>
                </ul>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="font-bold text-lg mb-2">ミサ</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>裁きの時間中にキラが誰か確認でき、チャット可能</li>
                  <li>交換・取調カードでキラをサポート</li>
                </ul>
              </div>
            </div>

            {/* L陣営 */}
            <div className="mb-6">
              <h4 className="text-xl font-bold text-blue-500 mb-3">🔵 L陣営</h4>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <p className="font-bold text-lg mb-2">L</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>「逮捕」カードを使用できる</li>
                  <li>「逮捕」の番号を変更できる</li>
                </ul>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <p className="font-bold text-lg mb-2">警察</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>「拳銃」を使用できる</li>
                  <li>「拳銃」の番号を変更できる</li>
                </ul>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="font-bold text-lg mb-2">ワタリ</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>ゲーム開始時にLが誰か把握</li>
                  <li>「逮捕」の番号を変更できる</li>
                </ul>
              </div>
            </div>

            {/* 第3陣営 */}
            <div>
              <h4 className="text-xl font-bold text-purple-500 mb-3">🟣 第3陣営</h4>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="font-bold text-lg mb-2">メロ</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>「拳銃」で指定プレイヤーを殺害できる</li>
                  <li>キラ殺害で即勝利</li>
                  <li className="text-yellow-400">⚠️ 「拳銃」使用後、全員に正体が明かされる</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ルール2: 各フェーズの行動と勝利条件 */}
          <section>
            <h3 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
              各フェーズの行動と勝利条件
            </h3>

            {/* 捜査の時間 */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-3">🔍 捜査の時間</h4>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <p className="font-bold mb-2">キラ陣営</p>
                <p className="text-gray-300">正体を隠しながら行動</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="font-bold mb-2">L陣営＋メロ</p>
                <p className="text-gray-300">情報を集めてキラを特定</p>
              </div>
            </div>

            {/* 裁きの時間 */}
            <div className="mb-6">
              <h4 className="text-xl font-bold mb-3">⚖️ 裁きの時間</h4>
              
              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <p className="font-bold mb-2">キラ</p>
                <p className="text-gray-300">13秒後に「確認」ボタン→標的選択（必須）</p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="font-bold mb-2">その他全員</p>
                <p className="text-gray-300">13秒以内に「確認」ボタンを押す</p>
              </div>
            </div>

            {/* 勝利条件 */}
            <div>
              <h4 className="text-xl font-bold mb-3">🏆 勝利条件</h4>
              
              <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4 mb-3">
                <p className="font-bold text-red-400 mb-2">🔴 キラ陣営の勝利</p>
                <p className="text-sm text-gray-300 mb-2">以下のいずれかを達成</p>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li>裁きの時間にL全員を殺害</li>
                  <li>L陣営を残り1人まで減らす</li>
                  <li>すべての「逮捕」カードが除外される</li>
                  <li className="text-yellow-400">※メロがL全員を殺害した場合もキラ陣営の勝利</li>
                </ul>
              </div>

              <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-3">
                <p className="font-bold text-blue-400 mb-2">🔵 L陣営の勝利</p>
                <p className="text-gray-300 text-sm">捜査の時間に「逮捕」でキラを逮捕</p>
              </div>

              <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-4">
                <p className="font-bold text-purple-400 mb-2">🟣 メロの勝利</p>
                <p className="text-gray-300 text-sm">捜査の時間に「拳銃」でキラを殺害</p>
              </div>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}