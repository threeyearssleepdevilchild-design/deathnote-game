import { useState } from 'react'
import RulesModal from './RulesModal'

export default function HomeScreen({ setCurrentScreen }) {
  const [showRules, setShowRules] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-red-500 text-center">
        DEATH NOTE 人狼
      </h1>
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-md">
        <button 
          onClick={() => setCurrentScreen('createRoom')}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-lg text-lg sm:text-xl transition touch-manipulation"
        >
          ルームを作成
        </button>
        <button 
          onClick={() => setCurrentScreen('joinRoom')}
          className="bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-lg text-lg sm:text-xl transition touch-manipulation"
        >
          ルームに参加
        </button>
        <button 
          onClick={() => setShowRules(true)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-lg text-lg sm:text-xl transition touch-manipulation"
        >
          📖 ルール説明
        </button>
      </div>

      {/* ルールモーダル */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  )
}