'use client';

import MoneyMonster from '@/components/MoneyMonster';
import Modal from '@/components/Modal'; // 新しく作成したModalコンポーネントをインポート
import { useState } from 'react';

async function dummyRestartChallenge() {
  console.log('もう一度チャレンジする（テスト用）');
}

async function dummyFinishChallenge() {
  console.log('今回は終了する（テスト用）');
}

export default function TestPage() {
  const [isMoneyMonsterGameCompleted, setIsMoneyMonsterGameCompleted] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // ポップアップの表示状態

  const dummyTotalAmount = 10000;
  const dummyRemainingAmount = 0;
  const dummyAchievementRate = 100;
  const dummyTotalSuccessDays = 30;
  const dummyTotalFailedDays = 0;

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>テストページ - ゲーム終了画面とポップアップ</h1>
      <p>これはゲーム終了時のMoneyMonsterコンポーネントの表示テストと、汎用ポップアップのテストです。</p>

      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <MoneyMonster
          totalAmount={dummyTotalAmount}
          remainingAmount={dummyRemainingAmount}
          achievementRate={dummyAchievementRate}
          totalSuccessDays={dummyTotalSuccessDays}
          totalFailedDays={dummyTotalFailedDays}
          isGameCompleted={isMoneyMonsterGameCompleted}
          onRestartChallenge={dummyRestartChallenge}
          onFinishChallenge={dummyFinishChallenge}
        />
      </div>

      <button onClick={() => setIsMoneyMonsterGameCompleted(!isMoneyMonsterGameCompleted)} style={{ marginTop: '20px', padding: '10px 20px', marginRight: '10px' }}>
        MoneyMonsterのゲーム完了状態をトグル
      </button>

      <button onClick={openPopup} style={{ marginTop: '20px', padding: '10px 20px' }}>
        ポップアップを開く
      </button>

      <Modal isOpen={isPopupOpen} onClose={closePopup} title="テストポップアップ">
        <p>これはテスト用のポップアップです。</p>
        <p>ここにゲーム終了時の要約などを表示できます。</p>
      </Modal>
    </div>
  );
} 
