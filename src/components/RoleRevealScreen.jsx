import { useState, useEffect } from 'react'
import { ref, onValue, update, get } from 'firebase/database'
import { database } from '../config/firebase'

export default function RoleRevealScreen({ roomId, nickname }) {
  const [myRole, setMyRole] = useState(null)
  const [myHand, setMyHand] = useState([])
  const [myConfirmed, setMyConfirmed] = useState(false)

  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        
        // 自分の正体と手札を取得
        if (data.roles && data.roles[nickname]) {
          setMyRole(data.roles[nickname].role)
        }
        if (data.hands && data.hands[nickname]) {
          setMyHand(data.hands[nickname])
        }
        
        // 自分が確認済みかチェック
        if (data.roleConfirmed && data.roleConfirmed[nickname]) {
          setMyConfirmed(true)
        }
      }
    })

    return () => unsubscribe()
  }, [roomId, nickname])

  const confirmRole = async () => {
    // すぐに確認済み状態にする
    setMyConfirmed(true)
    
    try {
      // 自分が確認したことを記録
      await update(ref(database, `rooms/${roomId}/game/roleConfirmed/${nickname}`), {
        confirmed: true,
        timestamp: Date.now()
      })

      // 全員が確認したかチェック
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const totalPlayers = Object.keys(data.roles || {}).length
        const confirmedCount = Object.keys(data.roleConfirmed || {}).length

        // 全員が確認した場合
        if (confirmedCount >= totalPlayers) {
          // ワタリがいる場合（7人プレイ）
          const hasWatari = Object.values(data.roles || {}).some(r => r.role.id === 'watari')
          
          if (hasWatari) {
  await update(ref(database, `rooms/${roomId}/game`), {
    phase: 'watari_check'
  })
} else {
  await update(ref(database, `rooms/${roomId}/game`), {
    phase: 'card_draw'  // ← 'investigation' から 'card_draw' に変更
  })
}
        }
      }
    } catch (error) {
      console.error('確認エラー:', error)
    }
  }

  if (!myRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">あなたの正体</h2>
        
        {/* 正体カード */}
        <div className={`bg-gradient-to-br ${
          myRole.color === 'red' 
            ? 'from-red-600 to-red-800' 
            : 'from-blue-600 to-blue-800'
        } rounded-lg p-8 mb-6 text-center`}>
          <div className="text-6xl font-bold mb-4">{myRole.name}</div>
          <div className="text-xl mb-4">
            {myRole.team === 'kira' ? 'キラチーム' : 'Lチーム'}
          </div>
          <div className="bg-black bg-opacity-30 rounded p-4 text-left">
            <p className="text-sm leading-relaxed">{myRole.description}</p>
          </div>
        </div>

        {/* 初期手札 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">あなたの初期手札</h3>
          <div className="grid grid-cols-2 gap-4">
            {myHand.map((card, index) => (
              <div 
                key={index}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-bold">{card.name}</span>
                  <span className="text-gray-400">#{card.number}</span>
                </div>
                <p className="text-sm text-gray-300">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={confirmRole}
          disabled={myConfirmed}
          className={`w-full font-bold py-4 rounded-lg text-xl transition ${
            myConfirmed
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {myConfirmed ? '✓ 確認済み' : '確認しました'}
        </button>

        {myConfirmed && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800 rounded-lg px-6 py-3">
              <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-white rounded-full"></div>
              <span className="text-gray-300">他のプレイヤーを待っています...</span>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 mt-4 text-sm">
          他のプレイヤーに正体がバレないように注意してください
        </p>
      </div>
    </div>
  )
}