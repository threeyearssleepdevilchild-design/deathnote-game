import { useState } from 'react'
import { ref, set } from 'firebase/database'
import { database } from '../config/firebase'
import { generateRoomCode } from '../utils/roomUtils'

export default function CreateRoomScreen({ setCurrentScreen, playerCount, setPlayerCount, setRoomId, setNickname }) {
  const [nickname, setNicknameLocal] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      alert('ニックネームを入力してください')
      return
    }

    setCreating(true)

    try {
      const roomCode = generateRoomCode()
      
      const roomData = {
        roomCode: roomCode,
        maxPlayers: playerCount,
        players: {
          [nickname]: {
            nickname: nickname,
            isHost: true,
            ready: false,
            joinedAt: Date.now()
          }
        },
        status: 'waiting',
        createdAt: Date.now()
      }

      await set(ref(database, `rooms/${roomCode}`), roomData)

      setRoomId(roomCode)
      setNickname(nickname)
      setCurrentScreen('lobby')

    } catch (error) {
      console.error('ルーム作成エラー:', error)
      alert('ルームの作成に失敗しました')
      setCreating(false)
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
        
        <h2 className="text-3xl font-bold mb-8 text-center">ルームを作成</h2>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-6">
          <div>
            <label className="block text-lg mb-2">あなたのニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNicknameLocal(e.target.value)}
              placeholder="例: キラ"
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-lg mb-4">プレイ人数を選択</label>
            <div className="grid grid-cols-5 gap-2">
              {[4, 5, 6, 7, 8].map(count => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`py-3 rounded-lg font-bold transition ${
                    playerCount === count
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {count}人
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreateRoom}
          disabled={creating}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? '作成中...' : 'ルームを作成する'}
        </button>
      </div>
    </div>
  )
}