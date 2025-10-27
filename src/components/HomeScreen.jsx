export default function HomeScreen({ setCurrentScreen }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-5xl font-bold mb-8 text-red-500">
        DEATH NOTE 人狼
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <button 
          onClick={() => setCurrentScreen('createRoom')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition"
        >
          ルームを作成
        </button>
        <button 
          onClick={() => setCurrentScreen('joinRoom')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition"
        >
          ルームに参加
        </button>
      </div>
    </div>
  )
}