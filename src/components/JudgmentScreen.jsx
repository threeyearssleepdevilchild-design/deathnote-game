import { useState, useEffect } from 'react'
import { ref, onValue, update, get } from 'firebase/database'
import { database } from '../config/firebase'

export default function JudgmentScreen({ roomId, nickname }) {
  const [gameData, setGameData] = useState(null)
  const [judgmentData, setJudgmentData] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [showKillSelect, setShowKillSelect] = useState(false)
  const [hasDeathNote, setHasDeathNote] = useState(false)
  const [countdown, setCountdown] = useState(13)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')

  // チャットメッセージの監視
  useEffect(() => {
    if (!roomId || !judgmentData) return
    
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
        // 古い順にソート
        messages.sort((a, b) => a.timestamp - b.timestamp)
        setChatMessages(messages)
      } else {
        setChatMessages([])
      }
    })
    
    return () => unsubscribe()
  }, [roomId, judgmentData])
  // カウントダウンタイマー
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // ゲームデータの監視
  useEffect(() => {
    const gameRef = ref(database, `rooms/${roomId}/game`)
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setGameData(data)
        setJudgmentData(data.judgmentInProgress)
        setMyRole(data.roles[nickname])
        
        // 自分がデスノートを持っているかチェック
        const myHand = data.hands[nickname] || []
        const hasNote = myHand.some(card => card.cardId === 'death_note')
        setHasDeathNote(hasNote)
        
        // 自分が確認済みかチェック
        if (data.judgmentInProgress?.confirmed?.[nickname]) {
          setHasConfirmed(true)
        } else {
          setHasConfirmed(false)
        }
      }
    })

    return () => unsubscribe()
  }, [roomId, nickname])

  // 確認ボタン
  const handleConfirm = async () => {
    try {
      const myRoleId = myRole?.role?.id || myRole?.roleId
      
      // キラでデスノートを持っている場合、殺害選択を表示
      if (myRoleId === 'kira' && hasDeathNote) {
        setShowKillSelect(true)
        return
      }
      
      // それ以外は通常の確認処理
      await confirmJudgment()
      
    } catch (error) {
      console.error('確認エラー:', error)
    }
  }

  // 裁きの時間の確認処理
  const confirmJudgment = async () => {
    try {
      await update(ref(database, `rooms/${roomId}/game/judgmentInProgress/confirmed/${nickname}`), {
        confirmed: true,
        timestamp: Date.now()
      })
      
      // 全員が確認したかチェック
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const totalPlayers = Object.keys(data.roles).length
        const confirmedCount = Object.keys(data.judgmentInProgress?.confirmed || {}).length
        
        // 全員が確認した場合、捜査の時間に戻る
        if (confirmedCount >= totalPlayers) {
          await update(ref(database, `rooms/${roomId}/game`), {
            judgmentInProgress: null,
            phase: 'card_draw'
          })
        }
      }
      
    } catch (error) {
      console.error('確認処理エラー:', error)
    }
  }

  // プレイヤーを殺害
  const handleKillPlayer = async (targetPlayer) => {
    try {
      const gameRef = ref(database, `rooms/${roomId}/game`)
      const snapshot = await get(gameRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        const deadPlayers = data.deadPlayers || []
        
        // 殺害対象の役職と手札を確認
        const targetRole = data.roles[targetPlayer]
        const targetRoleId = targetRole?.role?.id || targetRole?.roleId
        const targetHand = data.hands[targetPlayer] || []
        
        // 未使用の偽名カードを持っているかチェック
        const fakeNameCard = targetHand.find(card => card.cardId === 'fake_name' && !card.used)
        const fakeNameIndex = targetHand.findIndex(card => card.cardId === 'fake_name' && !card.used)
        
        if (fakeNameCard) {
          // 偽名カードで殺害を回避
          const newTargetHand = targetHand.map((card, index) => {
            if (index === fakeNameIndex) {
              return { ...card, used: true }
            }
            return card
          })
          
          // キラの確認も完了状態にする
          await update(ref(database, `rooms/${roomId}/game`), {
            [`hands/${targetPlayer}`]: newTargetHand,
            [`judgmentInProgress/confirmed/${nickname}`]: {
              confirmed: true,
              timestamp: Date.now()
            },
            lastAction: {
              type: 'fake_name_used',
              killer: nickname,
              survivor: targetPlayer,
              timestamp: Date.now()
            }
          })
          
          setShowKillSelect(false)
          
          alert(`${targetPlayer}は偽名カードで殺害を回避しました！`)
          
          // 全員が確認済みかチェック
          const updatedSnapshot = await get(gameRef)
          if (updatedSnapshot.exists()) {
            const updatedData = updatedSnapshot.val()
            const totalPlayers = Object.keys(updatedData.roles).length
            const confirmedCount = Object.keys(updatedData.judgmentInProgress?.confirmed || {}).length
            
            // 全員が確認した場合、捜査の時間に戻る
            if (confirmedCount >= totalPlayers) {
              await update(ref(database, `rooms/${roomId}/game`), {
                judgmentInProgress: null,
                phase: 'card_draw'
              })
            }
          }
          
          return
        }
        
        // 偽名カードがない場合、通常の殺害処理
        
        // Lを殺害した場合はゲーム終了
        if (targetRoleId === 'l') {
          await update(ref(database, `rooms/${roomId}/game`), {
            phase: 'game_over',
            winner: 'kira_team',
            winCondition: 'l_killed',
            killedPlayer: targetPlayer,
            timestamp: Date.now()
          })
          
          setShowKillSelect(false)
          alert(`${targetPlayer}（L）を殺害しました！キラチームの勝利です！`)
          return
        }
        
        // L以外を殺害した場合は通常処理
        const newDeadPlayers = [...deadPlayers, targetPlayer]
        
        // 死亡したプレイヤーの手札を捨て札に移動
        const targetHandCards = targetHand || []
        const newDiscardPile = [...(data.discardPile || []), ...targetHandCards]
        const newHands = {
          ...data.hands,
          [targetPlayer]: [] // 手札を空にする
        }
        
        await update(ref(database, `rooms/${roomId}/game`), {
          deadPlayers: newDeadPlayers,
          discardPile: newDiscardPile,
          hands: newHands,
          lastAction: {
            type: 'death_note',
            killer: nickname,
            victim: targetPlayer,
            timestamp: Date.now()
          }
        })
        
        setShowKillSelect(false)
        
        // 確認処理を実行
        await confirmJudgment()
        
        alert(`${targetPlayer}を殺害しました`)
      }
      
    } catch (error) {
      console.error('殺害エラー:', error)
    }
  }
// チャットメッセージを送信
  const sendChatMessage = async () => {
    try {
      if (!chatInput.trim()) return
      
      const myRoleId = myRole?.role?.id || myRole?.roleId
      
      // キラまたはミサのみ送信可能
      if (myRoleId !== 'kira' && myRoleId !== 'believer') {
        return
      }
      
      const chatRef = ref(database, `rooms/${roomId}/game/judgmentInProgress/chat`)
      const newMessageRef = ref(database, `rooms/${roomId}/game/judgmentInProgress/chat/${Date.now()}`)
      
      await update(newMessageRef, {
        player: nickname,
        message: chatInput.trim(),
        timestamp: Date.now()
      })
      
      setChatInput('')
      
    } catch (error) {
      console.error('チャット送信エラー:', error)
    }
  }
  // 殺害をスキップ
  const handleSkipKill = async () => {
    setShowKillSelect(false)
    await confirmJudgment()
  }

  if (!gameData || !judgmentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">データを読み込み中...</div>
      </div>
    )
  }

  // 自分の役職IDを取得
  const myRoleId = myRole?.role?.id || myRole?.roleId

  // 殺害可能なプレイヤーリスト（自分、ミサ、既に死亡しているプレイヤーを除く）
  const killablePlayer = gameData.turnOrder?.filter(player => 
    player !== nickname && 
    player !== judgmentData.misaPlayer &&
    !(gameData.deadPlayers || []).includes(player)
  ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* 左サイドバー */}
          <div className="lg:col-span-1 space-y-4">
            {/* 自分の役職 */}
            <div className={`bg-gradient-to-r ${
              myRole?.role.team === 'kira' 
                ? 'from-red-900 to-red-800' 
                : 'from-blue-900 to-blue-800'
            } rounded-lg p-4 border-2 border-white`}>
              <p className="text-xs text-gray-300 mb-1">あなたの正体</p>
              <p className="text-2xl font-bold">{myRole?.role.name}</p>
            </div>

            {/* カウントダウンタイマー */}
            <div className="bg-gray-800 rounded-lg p-4 border-2 border-yellow-500">
              <p className="text-xs text-gray-300 mb-1">13秒のカウント</p>
              <p className="text-xs text-gray-400 mb-2">ダウンタイマー</p>
              <div className="text-5xl font-bold text-yellow-400 text-center">
                {countdown}
              </div>
            </div>

            {/* 味方情報（キラ→ミサ、ミサ→キラ）*/}
            {/* キラ・ミサ専用チャット */}
            {(myRoleId === 'kira' || myRoleId === 'believer') && (
              <div className="bg-gray-800 rounded-lg border border-red-600 overflow-hidden">
                <div className="bg-red-900 p-2 text-center">
                  <p className="text-xs font-bold">秘密のチャット</p>
                </div>
                
                {/* メッセージ表示エリア */}
                <div className="h-40 overflow-y-auto p-3 space-y-2 bg-gray-900">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center">メッセージはありません</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-xs ${
                          msg.player === nickname ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span className="text-gray-400">{msg.player}: </span>
                        <span className="text-white">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
                
                {/* 入力エリア */}
                <div className="p-2 bg-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendChatMessage()
                      }
                    }}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-2 py-1 bg-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    maxLength={100}
                  />
                  <button
                    onClick={sendChatMessage}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-bold transition"
                  >
                    送信
                  </button>
                </div>
              </div>
            )}
            {myRoleId === 'kira' && judgmentData.misaPlayer && (
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-3 border border-red-600">
                <p className="text-xs text-gray-400 mb-1">味方</p>
                <p className="text-sm font-bold">ミサ: {judgmentData.misaPlayer}</p>
              </div>
            )}

            {myRoleId === 'believer' && judgmentData.kiraPlayer && (
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-3 border border-red-600">
                <p className="text-xs text-gray-400 mb-1">味方</p>
                <p className="text-sm font-bold">キラ: {judgmentData.kiraPlayer}</p>
              </div>
            )}
          </div>

          {/* 右メインエリア */}
          <div className="lg:col-span-3 space-y-4">
            {/* ヘッダー */}
            <div className="bg-white rounded-lg p-4 text-center border-4 border-black">
              <h1 className="text-3xl font-bold mb-2 text-black">⚖️ 裁きの時間 ⚖️</h1>
              <p className="text-black text-sm">L陣営は確認ボタンを押してください</p>
              <p className="text-black text-sm">キラがデスノートを所持している場合</p>
              <p className="text-black text-sm">確認ボタンを押して、誰かを必ず殺害して下さい</p>
            </div>

            {/* 画像エリア */}
            <div className="relative rounded-lg overflow-hidden border-4 border-black min-h-[600px]">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(/images/judgment.png)' }}
              />
            </div>

            {/* 確認ボタン */}
            {!hasConfirmed ? (
              <button
                onClick={handleConfirm}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-2 rounded-lg text-xl transition shadow-lg border-4 border-black"
              >
                確認ボタン
              </button>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 text-center border-4 border-black">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-lg font-bold mb-1">確認済み</p>
                <p className="text-sm text-gray-400">他のプレイヤーの確認を待っています...</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* デスノート殺害選択モーダル */}
      {showKillSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-red-900 to-black rounded-lg max-w-md w-full p-6 border-2 border-red-600">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💀</div>
              <h3 className="text-3xl font-bold mb-2">デスノート</h3>
              <p className="text-gray-300">殺害する相手を選んでください</p>
            </div>
            
            <div className="space-y-2 mb-4">
              {killablePlayer.map(player => (
                <button
                  key={player}
                  onClick={() => handleKillPlayer(player)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
                >
                  {player}
                </button>
              ))}
            </div>

            <button
              onClick={handleSkipKill}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
            >
              今回は殺害しない
            </button>
          </div>
        </div>
      )}
    </div>
  )
}