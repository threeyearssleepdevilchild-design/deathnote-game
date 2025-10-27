import { useState, useEffect } from 'react'
import { ref, onValue, remove, update, onDisconnect } from 'firebase/database'
import { database } from '../config/firebase'

export default function LobbyScreen({ roomId, nickname, playerCount, setCurrentScreen, setRoomId }) {
  const [players, setPlayers] = useState({})
  const [spectators, setSpectators] = useState({})
  const [isHost, setIsHost] = useState(false)
  const [myReady, setMyReady] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomId}/players`)
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val()
        setPlayers(playersData)
        
        // 自分がプレイヤーかチェック
        if (playersData[nickname]) {
          setIsHost(playersData[nickname]?.isHost || false)
          setMyReady(playersData[nickname]?.ready || false)
          setIsSpectator(false)
        }
      }
    })

    // 観戦者リストの監視
    const spectatorsRef = ref(database, `rooms/${roomId}/spectators`)
    const unsubscribeSpectators = onValue(spectatorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const spectatorsData = snapshot.val()
        setSpectators(spectatorsData)
        
        // 自分が観戦者かチェック
        if (spectatorsData[nickname]) {
          setIsSpectator(true)
          setIsHost(false)
        }
      } else {
        setSpectators({})
      }
    })

    // 切断時の処理
    const playerRef = ref(database, `rooms/${roomId}/players/${nickname}`)
    const spectatorRef = ref(database, `rooms/${roomId}/spectators/${nickname}`)
    onDisconnect(playerRef).remove()
    onDisconnect(spectatorRef).remove()

    return () => {
      unsubscribePlayers()
      unsubscribeSpectators()
    }
  }, [roomId, nickname, setCurrentScreen])

  const toggleReady = async () => {
    try {
      await update(ref(database, `rooms/${roomId}/players/${nickname}`), {
        ready: !myReady
      })
    } catch (error) {
      console.error('準備完了の更新エラー:', error)
    }
  }

  const leaveRoom = async () => {
    try {
      if (isSpectator) {
        // 観戦者として退出
        await remove(ref(database, `rooms/${roomId}/spectators/${nickname}`))
      } else {
        // プレイヤーとして退出
        await remove(ref(database, `rooms/${roomId}/players/${nickname}`))
        
        if (isHost) {
          await remove(ref(database, `rooms/${roomId}`))
        }
      }
      
      setRoomId(null)
      setCurrentScreen('home')
    } catch (error) {
      console.error('退出エラー:', error)
    }
  }

  const forceEndRoom = async () => {
    if (window.confirm('ルームを強制終了しますか？')) {
      try {
        await remove(ref(database, `rooms/${roomId}`))
        setRoomId(null)
        setCurrentScreen('home')
      } catch (error) {
        console.error('ルーム終了エラー:', error)
      }
    }
  }

  const startGame = async () => {
    if (!canStart) return

    try {
      const playerNames = playersList.map(p => p.nickname)
      
      // 正体カードと手札を配布
      const { distributeRoles, distributeInitialHands } = await import('../utils/gameUtils')
      const roleAssignments = distributeRoles(playerCount, playerNames)
      const { hands, deck, discardPile } = distributeInitialHands(playerCount, playerNames)

      // ゲームデータをFirebaseに保存
const gameData = {
  status: 'role_reveal',
  phase: 'role_reveal',  // ← この行はそのまま
  roles: roleAssignments,
  hands: hands,
  deck: deck,
  discardPile: discardPile,
  currentTurn: 0,
  eliminatedPlayers: [],
  turnOrder: playerNames,
  startedAt: Date.now()
}

      await update(ref(database, `rooms/${roomId}`), {
        status: 'playing',
        game: gameData
      })

    } catch (error) {
      console.error('ゲーム開始エラー:', error)
      alert('ゲームの開始に失敗しました')
    }
  }

  const playersList = Object.values(players).filter(p => p && p.nickname) // nullチェック追加
  const currentPlayerCount = playersList.length
  const allReady = playersList.filter(p => !p.isHost).every(p => p.ready)
  const canStart = currentPlayerCount === playerCount && allReady && currentPlayerCount > 0

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-4">待機ロビー</h2>
          <div className="bg-gray-800 rounded-lg p-4 inline-block">
            <p className="text-gray-400 text-sm mb-1">ルームコード</p>
            <p className="text-3xl font-bold text-red-500">{roomId}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">参加者</h3>
            <span className="text-gray-400">
              {currentPlayerCount} / {playerCount}人
            </span>
          </div>
          
          <div className="space-y-2">
            {playersList.map((player) => (
              <div 
                key={player.nickname}
                className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-bold">
                    {player.nickname?.charAt(0) || '?'}
                  </div>
                  <span className="font-medium">{player.nickname || '名無し'}</span>
                  {player.isHost && (
                    <span className="bg-yellow-600 text-xs px-2 py-1 rounded">
                      ホスト
                    </span>
                  )}
                  {player.nickname === nickname && (
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                      あなた
                    </span>
                  )}
                </div>
                {!player.isHost && player.ready && (
                  <span className="text-green-400 font-bold">✓ 準備完了</span>
                )}
              </div>
            ))}
          </div>
        </div>
{/* 観戦者リスト */}
        {Object.keys(spectators).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">観戦者</h3>
              <span className="text-gray-400">
                {Object.keys(spectators).length}人
              </span>
            </div>
            
            <div className="space-y-2">
              {Object.values(spectators).filter(s => s && s.nickname).map((spectator) => (
                <div 
                  key={spectator.nickname}
                  className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      {spectator.nickname?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium">{spectator.nickname || '名無し'}</span>
                    <span className="bg-purple-600 text-xs px-2 py-1 rounded">
                      観戦
                    </span>
                    {spectator.nickname === nickname && (
                      <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                        あなた
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {!isHost && !isSpectator && (
            <button 
              onClick={toggleReady}
              className={`w-full font-bold py-4 rounded-lg text-xl transition ${
                myReady
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {myReady ? '✓ 準備完了' : '準備完了'}
            </button>
          )}

          <div className="flex gap-3">
            <button 
              onClick={leaveRoom}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition"
            >
              退出
            </button>
            
            {isHost && (
              <>
                <button 
                  onClick={forceEndRoom}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg transition"
                >
                  ルーム終了
                </button>
                <button 
                  onClick={startGame}
                  disabled={!canStart}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ゲーム開始
                </button>
              </>
            )}
          </div>
        </div>

        {isHost && !canStart && (
          <p className="text-center text-gray-400 mt-4">
            {currentPlayerCount < playerCount 
              ? `全員が揃うまで待機中... (${playerCount - currentPlayerCount}人待ち)`
              : '全員が準備完了するまで待機中...'}
          </p>
        )}
      </div>
    </div>
  )
}