import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../config/firebase'

export default function SpectatorScreen({ roomId, nickname }) {
  const [gameData, setGameData] = useState(null)
  const [chatMessages, setChatMessages] = useState([])

  // ゲームデータの監視
  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameData(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [roomId])

  // チャットメッセージの監視（裁きの時間中）
  useEffect(() => {
    if (!roomId || !gameData?.judgmentInProgress) return
    
    const chatRef = ref(database, `rooms/${roomId}/game/judgmentInProgress/chat`)
    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = []
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          })
        })
        messages.sort((a, b) => a.timestamp - b.timestamp)
        setChatMessages(messages)
      } else {
        setChatMessages([])
      }
    })
    
    return () => unsubscribe()
  }, [roomId, gameData?.judgmentInProgress])

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">観戦データを読み込み中...</div>
      </div>
    )
  }

  const currentPlayer = gameData.turnOrder?.[gameData.currentTurn % gameData.turnOrder.length]
  const players = gameData.turnOrder || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        
        {/* ヘッダー */}
        <div className="bg-purple-800 rounded-lg p-4 mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">👁️ 観戦モード 👁️</h1>
          <p className="text-sm text-gray-300">全ての情報が見えています</p>
        </div>

        {/* 現在のフェーズ */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-lg font-bold">
            {gameData.phase === 'card_draw' && '🃏 カードを引く'}
            {gameData.phase === 'card_use' && '✨ カードを使用'}
            {gameData.phase === 'judgment' && '⚖️ 裁きの時間'}
            {gameData.phase === 'game_over' && '🏆 ゲーム終了'}
          </p>
          {currentPlayer && gameData.phase !== 'judgment' && (
            <p className="text-sm text-gray-400 mt-2">
              現在のプレイヤー: {currentPlayer}
            </p>
          )}
        </div>

        {/* 全プレイヤーの情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {players.map((player) => {
            const playerRole = gameData.roles[player]
            const roleName = playerRole?.role?.name
            const roleTeam = playerRole?.role?.team
            const playerHand = gameData.hands[player] || []
            const isDead = (gameData.deadPlayers || []).includes(player)
            
            const teamColor = 
              roleTeam === 'kira' ? 'from-red-900 to-red-800' :
              roleTeam === 'l' ? 'from-blue-900 to-blue-800' :
              roleTeam === 'melo' ? 'from-purple-900 to-purple-800' :
              'from-gray-900 to-gray-800'
            
            return (
              <div
                key={player}
                className={`bg-gradient-to-br ${teamColor} rounded-lg p-4 border-2 ${
                  isDead ? 'border-gray-700 opacity-60' : 'border-white'
                }`}
              >
                {/* プレイヤー名と役職 */}
                <div className="mb-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">
                      {player}
                      {isDead && <span className="ml-2">💀</span>}
                    </h3>
                    <span className="text-2xl">
                      {roleTeam === 'kira' && '😈'}
                      {roleTeam === 'l' && '🕵️'}
                      {roleTeam === 'melo' && '🔫'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{roleName}</p>
                </div>

                {/* 手札 */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">
                    手札 ({playerHand.length}枚)
                  </p>
                  <div className="space-y-1">
                    {playerHand.map((card, index) => (
                      <div
                        key={`${card.id || card.cardId}-${index}`}
                        className="bg-black bg-opacity-30 rounded p-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{card.name}</span>
                          <span className="text-gray-400">#{card.number}</span>
                        </div>
                        {card.cardId === 'death_note' && (
                          <span className="text-red-400 text-xs">💀 デスノート</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* キラ・ミサチャット（裁きの時間中） */}
        {gameData.phase === 'judgment' && chatMessages.length > 0 && (
          <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 border-2 border-red-600">
            <h3 className="text-lg font-bold mb-3">🔴 キラ・ミサの秘密チャット</h3>
            <div className="bg-black bg-opacity-30 rounded p-3 space-y-2 max-h-40 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="text-red-400 font-bold">{msg.player}:</span>
                  <span className="text-white ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 山札・捨て札情報 */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">山札</p>
            <p className="text-3xl font-bold">{gameData.deck?.length || 0}枚</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">捨て札</p>
            <p className="text-3xl font-bold">{gameData.discardPile?.length || 0}枚</p>
          </div>
        </div>
      </div>
    </div>
  )
}