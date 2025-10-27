import { useState, useEffect } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { database } from '../config/firebase'

export default function WatariCheckScreen({ roomId, nickname }) {
  const [myRole, setMyRole] = useState(null)
  const [lPlayers, setLPlayers] = useState([])
  const [allConfirmed, setAllConfirmed] = useState(false)

  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        
        // 自分の正体を取得
        if (data.roles && data.roles[nickname]) {
          setMyRole(data.roles[nickname].role)
        }

        // Lのプレイヤーを探す
        if (data.roles) {
          const ls = Object.entries(data.roles)
            .filter(([name, roleData]) => roleData.role.id === 'l')
            .map(([name]) => name)
          setLPlayers(ls)
        }

        // 全員が確認したかチェック
        if (data.watariConfirmed) {
          setAllConfirmed(true)
        }
      }
    })

    return () => unsubscribe()
  }, [roomId, nickname])

const confirmAndProceed = async () => {
  try {
    await update(ref(database, `rooms/${roomId}/game`), {
      watariConfirmed: true,
      phase: 'card_draw'
    })
  } catch (error) {
    console.error('確認エラー:', error)
  }
}

  // ワタリ以外の場合
  if (myRole?.id !== 'watari') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-4">少々お待ちください</h2>
            <p className="text-gray-400">
              ワタリがLを確認しています...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ワタリの場合
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">ワタリの能力</h2>
        
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-8 mb-6 text-center">
          <div className="text-4xl font-bold mb-4">Lの確認</div>
          <p className="text-lg mb-6">
            あなたはワタリです。以下のプレイヤーがLです。
          </p>
          
          <div className="bg-black bg-opacity-30 rounded-lg p-6">
            {lPlayers.length > 0 ? (
              <div className="space-y-3">
                {lPlayers.map((playerName) => (
                  <div 
                    key={playerName}
                    className="bg-blue-700 rounded-lg p-4 flex items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xl">
                      {playerName.charAt(0)}
                    </div>
                    <span className="text-2xl font-bold">{playerName}</span>
                    <span className="text-xl">= L</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">Lが見つかりません</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-3">⚠️ 重要な注意事項</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• この情報は他のプレイヤーには見えていません</li>
            <li>• ゲーム中、Lを守るように行動してください</li>
            <li>• しかし、あまりにも露骨だとキラに気づかれます</li>
          </ul>
        </div>

        <button 
          onClick={confirmAndProceed}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-xl transition"
        >
          確認しました
        </button>
      </div>
    </div>
  )
}