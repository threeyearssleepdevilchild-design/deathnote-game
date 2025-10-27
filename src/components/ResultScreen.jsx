import { useState, useEffect } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { database } from '../config/firebase'

export default function ResultScreen({ roomId, setCurrentScreen, setRoomId }) {
  const [gameData, setGameData] = useState(null)

  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameData(snapshot.val())
      }
    })

    return () => unsubscribe()
  }, [roomId])

  const handleBackToHome = async () => {
    try {
      // ルームを削除
      await remove(ref(database, `rooms/${roomId}`))
      setRoomId(null)
      setCurrentScreen('home')
    } catch (error) {
      console.error('ルーム削除エラー:', error)
      setCurrentScreen('home')
    }
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">結果を読み込み中...</div>
      </div>
    )
  }

  // 勝者情報の取得
  const winner = gameData.winner
  const winCondition = gameData.winCondition

  // 勝者名の表示
  const getWinnerName = () => {
    switch (winner) {
      case 'kira_team':
        return 'キラチーム'
      case 'l_team':
        return 'Lチーム'
      case 'melo':
        return 'メロ'
      default:
        return '不明'
    }
  }

  // 勝利条件の説明
  const getWinConditionText = () => {
    switch (winCondition) {
      case 'arrest':
        return `${gameData.arrestedPlayer}（キラ）が逮捕されました`
      case 'arrest_cards_eliminated':
        return '逮捕カードが全て除外されました'
      case 'l_killed':
        return `${gameData.killedPlayer}（L）がデスノートで殺害されました`
      case 'melo_killed_kira':
        return `メロが${gameData.killedPlayer}（キラ）を殺害しました`
      case 'all_l_eliminated':
        return '全てのLが排除されました'
      case 'kira_vs_l_alone':
        return 'キラとLの一騎打ちになりました'
      default:
        return winCondition || '勝利条件不明'
    }
  }

  // 勝者の背景色
  const getWinnerColor = () => {
    switch (winner) {
      case 'kira_team':
        return 'from-red-600 to-red-800'
      case 'l_team':
        return 'from-blue-600 to-blue-800'
      case 'melo':
        return 'from-purple-600 to-purple-800'
      default:
        return 'from-gray-600 to-gray-800'
    }
  }

  // プレイヤーリスト
  const players = gameData.turnOrder || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* 勝者表示 */}
        <div className={`bg-gradient-to-br ${getWinnerColor()} rounded-lg p-8 mb-6 text-center shadow-2xl`}>
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-5xl font-bold mb-4">{getWinnerName()}の勝利！</h1>
          <p className="text-xl text-gray-200">{getWinConditionText()}</p>
        </div>

        {/* 全プレイヤーの役職公開 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">プレイヤーの役職</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => {
              const playerRole = gameData.roles[player]
              const roleName = playerRole?.role?.name
              const roleTeam = playerRole?.role?.team
              const isDead = (gameData.deadPlayers || []).includes(player)
              
              // チームカラー
              const teamColor = 
                roleTeam === 'kira' ? 'from-red-900 to-red-800' :
                roleTeam === 'l' ? 'from-blue-900 to-blue-800' :
                roleTeam === 'melo' ? 'from-purple-900 to-purple-800' :
                'from-gray-900 to-gray-800'
              
              return (
                <div
                  key={player}
                  className={`bg-gradient-to-r ${teamColor} rounded-lg p-4 border-2 ${
                    isDead ? 'border-gray-700 opacity-60' : 'border-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold">
                        {player}
                        {isDead && <span className="ml-2 text-gray-400">💀</span>}
                      </p>
                      <p className="text-sm text-gray-300">{roleName}</p>
                    </div>
                    <div className={`text-4xl ${isDead ? 'grayscale' : ''}`}>
                      {roleTeam === 'kira' && '😈'}
                      {roleTeam === 'l' && '🕵️'}
                      {roleTeam === 'melo' && '🔫'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ホームに戻るボタン */}
        <button
          onClick={handleBackToHome}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg text-xl transition shadow-lg"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  )
}