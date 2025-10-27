import { useState } from 'react'
import { ref, set, get } from 'firebase/database'
import { database } from '../config/firebase'

export default function JoinRoomScreen({ setCurrentScreen, setRoomId, setNickname }) {
  const [roomCode, setRoomCode] = useState('')
  const [nickname, setNicknameLocal] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      alert('ルームコードを入力してください')
      return
    }
    if (!nickname.trim()) {
      alert('ニックネームを入力してください')
      return
    }

    setJoining(true)

    try {
      const roomRef = ref(database, `rooms/${roomCode}`)
      const snapshot = await get(roomRef)

      if (!snapshot.exists()) {
        alert('ルームが見つかりません')
        setJoining(false)
        return
      }

      const roomData = snapshot.val()

      const currentPlayers = Object.keys(roomData.players || {}).length
      const isFull = currentPlayers >= roomData.maxPlayers
      
      // 満員の場合は観戦者として参加
      if (isFull) {
        // 観戦者として既に同じニックネームがあるかチェック
        if (roomData.spectators && roomData.spectators[nickname]) {
          alert('このニックネームは既に使用されています')
          setJoining(false)
          return
        }
        
        await set(ref(database, `rooms/${roomCode}/spectators/${nickname}`), {
          nickname: nickname,
          isSpectator: true,
          joinedAt: Date.now()
        })
        
        setRoomId(roomCode)
        setNickname(nickname)
        setCurrentScreen('lobby')
        
        alert('プレイヤーが満員のため、観戦者として参加しました')
        return
      }

      if (roomData.players && roomData.players[nickname]) {
        alert('このニックネームは既に使用されています')
        setJoining(false)
        return
      }

      await set(ref(database, `rooms/${roomCode}/players/${nickname}`), {
        nickname: nickname,
        isHost: false,
        ready: false,
        joinedAt: Date.now()
      })

      setRoomId(roomCode)
      setNickname(nickname)
      setCurrentScreen('lobby')

    } catch (error) {
      console.error('ルーム参加エラー:', error)
      alert('ルームへの参加に失敗しました')
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => setCurrentScreen('home')}
          className="mb-8 text-gray-400 hover:text-white transition"
        >
          ← 戻る
        </button>
        
        <h2 className="text-3xl font-bold mb-8 text-center">ルームに参加</h2>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block text-lg mb-2">ルームコード</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="例: ABC123"
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-lg mb-2">ニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNicknameLocal(e.target.value)}
              placeholder="例: L"
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <button 
          onClick={handleJoinRoom}
          disabled={joining}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {joining ? '参加中...' : '参加する'}
        </button>
      </div>
    </div>
  )
}