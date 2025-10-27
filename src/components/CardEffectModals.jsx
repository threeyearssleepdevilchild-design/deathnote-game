// プレイヤー選択モーダル
export function PlayerSelectModal({ 
  players, 
  onClose, 
  onSelect,
  title,
  description,
  excludeSelf = true,
  currentPlayer = null
}) {
  const availablePlayers = excludeSelf && currentPlayer
    ? players.filter(p => p !== currentPlayer)
    : players

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-2xl font-bold mb-2 text-center">{title}</h3>
        <p className="text-gray-400 text-center mb-6">{description}</p>
        
        <div className="space-y-2 mb-6">
          {availablePlayers.map((player) => (
            <button
              key={player}
              onClick={() => onSelect(player)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                {player.charAt(0)}
              </div>
              <span>{player}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

// 情報表示モーダル
export function InfoModal({ 
  title, 
  content, 
  onClose 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>
        <div className="bg-gray-700 rounded-lg p-6 mb-6">
          {content}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
        >
          確認
        </button>
      </div>
    </div>
  )
}

// カード選択モーダル
export function CardSelectModal({ 
  cards, 
  onClose, 
  onSelect,
  title,
  description,
  showWarning = false
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-2 text-center">{title}</h3>
        <p className="text-gray-400 text-center mb-6">{description}</p>
        
        {showWarning && (
          <div className="bg-yellow-900 bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
            <p className="text-yellow-400 text-sm text-center">
              ⚠️ より小さい数字のカードを所持している場合、確認メッセージが表示されます
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => onSelect(card, index)}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 border-2 border-blue-500 transition text-left"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold">{card.name}</span>
                <span className="text-gray-400 text-sm">#{card.number}</span>
              </div>
              <p className="text-xs text-gray-300">{card.description}</p>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

// 確認モーダル
export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "はい",
  cancelText = "いいえ"
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>
        <p className="text-gray-300 text-center mb-6 whitespace-pre-line">{message}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// カードアクション選択モーダル
export function CardActionModal({
  card,
  onUse,
  onDiscard,
  onClose
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-2xl font-bold mb-4 text-center">{card.name}</h3>
        
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xl font-bold">{card.name}</span>
            <span className="text-gray-400">#{card.number}</span>
          </div>
          <p className="text-sm text-gray-300">{card.description}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onUse}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            使用する
          </button>
          
          {card.canDiscard !== false && (
            <button
              onClick={onDiscard}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
            >
              捨て札にする
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
          >
            キャンセル
          </button>
        </div>

        {card.canDiscard === false && (
          <p className="text-yellow-400 text-sm text-center mt-4">
            ⚠️ このカードは捨て札にできません
          </p>
        )}
      </div>
    </div>
  )
}