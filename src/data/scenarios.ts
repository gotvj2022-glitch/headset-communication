export interface DialogueTurn {
  id: string;
  order: number;
  speaker: 'Cockpit' | 'Ground';
  text: string;
  vietnamese: string;
  pronunciationNotes?: string;
  prowords?: string[];
  keyActions?: string;
}

export interface DialoguePair {
  pairIndex: number; // 1 to 10
  groundTurn: DialogueTurn;
  cockpitTurn: DialogueTurn;
  expectedInitiator: 'Cockpit' | 'Ground';
}

export interface Scenario {
  id: string;
  chapter: number;
  chapterTitle: string;
  title: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  aircraft: string;
  flight: string;
  location: string;
  equipment: string;
  conditions: string;
  abnormality?: string;
  objective: string;
  referenceDoc: string;
  rubricMaxScore: number;
  dialoguePairs: DialoguePair[];
  prohibitedActions?: string[];
  handSignals?: { step: string; description: string }[];
  explanationNotes?: string;
}

export interface ProwordDefinition {
  proword: string;
  meaning: string;
  whenToUse: string;
  notUsedWhen: string;
  vietnamese: string;
}

export const AVIATION_PROWORDS: ProwordDefinition[] = [
  {
    proword: 'ROGER',
    meaning: 'I have received and understood all of your last transmission.',
    whenToUse: 'Confirming you heard and understood.',
    notUsedWhen: 'Confirming you will perform an action (use WILCO instead).',
    vietnamese: 'Đã nhận rõ toàn bộ thông tin (không đồng nghĩa với việc cam kết thực hiện).'
  },
  {
    proword: 'WILCO',
    meaning: 'I understand your message and will comply with it.',
    whenToUse: 'Confirming both understanding and immediate compliance.',
    notUsedWhen: 'When only acknowledging without taking action.',
    vietnamese: 'Đã hiểu rõ và sẽ thực hiện ngay theo chỉ thị.'
  },
  {
    proword: 'AFFIRM',
    meaning: 'Yes / Correct.',
    whenToUse: 'Affirmative response to a question or confirmation request.',
    notUsedWhen: 'Do not use colloquial "Yeah", "OK", or "Sure".',
    vietnamese: 'Khẳng định đúng / Đồng ý (thay thế cho Yes).'
  },
  {
    proword: 'NEGATIVE',
    meaning: 'No / Permission not granted / That is not correct.',
    whenToUse: 'Denying permission or stating incorrect condition.',
    notUsedWhen: 'Do not use "Nope" or "Not really".',
    vietnamese: 'Phủ định / Không được phép / Chưa chính xác (thay cho No).'
  },
  {
    proword: 'SAY AGAIN',
    meaning: 'Repeat all, or the specified part, of your last transmission.',
    whenToUse: 'Did not hear clearly or need verification due to noise.',
    notUsedWhen: 'Requesting new/additional information.',
    vietnamese: 'Yêu cầu lặp lại toàn bộ hoặc một phần câu nói vừa rồi do nghe không rõ.'
  },
  {
    proword: 'CORRECTION',
    meaning: 'An error has been made in this transmission. The correct version follows.',
    whenToUse: 'You made an error and need to correct yourself immediately.',
    notUsedWhen: 'Correcting the other party (use "Negative" followed by correct info).',
    vietnamese: 'Đính chính sai sót trong câu nói của chính mình.'
  },
  {
    proword: 'CONFIRM',
    meaning: 'Request verification of clearance, instruction, or action.',
    whenToUse: 'Need the other party to verify critical safety information.',
    notUsedWhen: 'Simply expressing general thanks.',
    vietnamese: 'Yêu cầu bên kia xác nhận lại thông tin quan trọng.'
  },
  {
    proword: 'STANDBY',
    meaning: 'Wait and I will call you.',
    whenToUse: 'Temporarily busy or verifying operational parameters.',
    notUsedWhen: 'Leaving frequency indefinitely without notice.',
    vietnamese: 'Chờ máy trong giây lát, tôi sẽ gọi lại ngay.'
  },
  {
    proword: 'WORDS TWICE',
    meaning: 'Send every word, or group of words, twice.',
    whenToUse: 'Difficult communication conditions; high engine noise or severe interference.',
    notUsedWhen: 'Normal clean communication channel.',
    vietnamese: 'Yêu cầu nhắc lại mỗi từ hai lần do đường truyền nhiễu/tiếng ồn lớn.'
  },
  {
    proword: 'CHECK',
    meaning: 'Examine a system or procedure.',
    whenToUse: 'Acknowledging reading of instruments or verifying engine parameters.',
    notUsedWhen: 'General conversation approval.',
    vietnamese: 'Kiểm tra hệ thống hoặc thông số kỹ thuật.'
  }
];

export const NATO_PHONETIC_ALPHABET: Record<string, string> = {
  A: 'Alfa (AL-fah)',
  B: 'Bravo (BRAH-voh)',
  C: 'Charlie (CHAR-lee)',
  D: 'Delta (DELL-tah)',
  E: 'Echo (ECK-oh)',
  F: 'Foxtrot (FOKS-trot)',
  G: 'Golf (GOLF)',
  H: 'Hotel (HOH-tell)',
  I: 'India (IN-dee-ah)',
  J: 'Juliett (JEW-lee-ETT)',
  K: 'Kilo (KEY-loh)',
  L: 'Lima (LEE-mah)',
  M: 'Mike (MIKE)',
  N: 'November (no-VEM-ber)',
  O: 'Oscar (OSS-cah)',
  P: 'Papa (PAH-pah)',
  Q: 'Quebec (keh-BECK)',
  R: 'Romeo (ROH-me-oh)',
  S: 'Sierra (see-AIR-rah)',
  T: 'Tango (TANG-go)',
  U: 'Uniform (YOU-nee-form)',
  V: 'Victor (VIK-tah)',
  W: 'Whiskey (WISS-key)',
  X: 'X-ray (ECKS-ray)',
  Y: 'Yankee (YANG-key)',
  Z: 'Zulu (ZOO-loo)',
  '0': 'Zero (ZEE-ro)',
  '1': 'Wun (WUN)',
  '2': 'Too (TOO)',
  '3': 'Tree (TREE)',
  '4': 'Fower (FOW-er)',
  '5': 'Fife (FIFE)',
  '6': 'Six (SIX)',
  '7': 'Seven (SEV-en)',
  '8': 'Ait (AIT)',
  '9': 'Niner (NINE-er)'
};

export const SCENARIOS: Scenario[] = [
  // CHAPTER 1 - SCENARIO 1
  {
    id: 'ch1-sc1',
    chapter: 1,
    chapterTitle: 'Chương 1: Quy trình Đẩy & Kéo Tàu Bay',
    title: 'Đẩy A320 thông thường - Xe kéo có cần (Conventional Towbar Tug)',
    difficulty: 'Basic',
    aircraft: 'VN-A649 (Airbus A320neo)',
    flight: 'VJ100',
    location: 'Sân bay Tân Sơn Nhất (SGN) - Vị trí đỗ E05',
    equipment: 'Xe kéo có cần kéo (Conventional Towbar Tug gắn càng trước)',
    conditions: 'Ban ngày, tầm nhìn tốt, mọi dịch vụ mặt đất đã hoàn tất',
    objective: 'Thực hiện quy trình đàm thoại đẩy tàu bay chuẩn ICAO từ lúc thiết lập đến khi ngắt kết nối an toàn.',
    referenceDoc: 'VJC-VJAA-M-125 & VJC-GOP-M-01',
    rubricMaxScore: 20,
    prohibitedActions: [
      'Không đặt chân lên bàn đạp phanh khi tàu bay đang di chuyển đẩy lui.',
      'Không bật thử hệ thống đèn ngoài tàu bay từ buồng lái vào ban đêm khi đang đẩy.',
      'Không cho phép lái xe kéo tăng tốc đột ngột, phanh gấp hoặc bẻ lái gắt.',
      'Không đi bộ trước mũi xe kéo hoặc chặn đường di chuyển của xe kéo.',
      'Duy trì cự ly tối thiểu 3m cách cụm bánh mũi và cần kéo.',
      'Tuyệt đối không ngắt kết nối tai nghe khi chưa có lệnh từ tổ bay.'
    ],
    handSignals: [
      { step: 'Cài phanh đỗ', description: 'Nắm tay phải giơ cao quá đầu' },
      { step: 'Nhả phanh đỗ', description: 'Xòe bàn tay (cử chỉ nhả)' },
      { step: 'Sẵn sàng đẩy/kéo', description: 'Ngón tay cái giơ lên (Thumbs up)' },
      { step: 'Hướng đẩy (Bắc)', description: 'Ngón trỏ chạm mũi tàu rồi chỉ thẳng về hướng Bắc' },
      { step: 'Sau khi dừng đẩy', description: 'Nắm tay phải giơ cao quá đầu yêu cầu cài phanh' },
      { step: 'Ngắt kết nối', description: 'Vẫy tay cách xa tàu bay về phía bên phải kèm dải băng đỏ chốt an toàn' }
    ],
    explanationNotes: 'Đây là tình huống chuẩn mực cốt lõi mọi học viên VJAA phải thuần thục. 10 cặp đối đáp bao quát từ chào ban đầu, xác nhận chốt an toàn, cấp phép đẩy, nhả phanh, nổ động cơ 2, nổ động cơ 1, kết thúc đẩy, cài phanh và ngắt tai nghe ra hiệu tay bên phải.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p1-c',
          order: 1,
          speaker: 'Cockpit',
          text: 'Cockpit to Ground.',
          vietnamese: 'Tổ bay gọi mặt đất.',
          pronunciationNotes: 'Phát âm rõ ràng "Cockpit", không nuốt âm cuối "t".'
        },
        groundTurn: {
          id: 'ch1-sc1-p1-g',
          order: 2,
          speaker: 'Ground',
          text: 'Ground to Cockpit. Ready to pushback.',
          vietnamese: 'Mặt đất nghe buồng lái. Đã sẵn sàng đẩy lùi.',
          pronunciationNotes: 'Nhấn mạnh từ "Ready to pushback".'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p2-c',
          order: 3,
          speaker: 'Cockpit',
          text: 'Clear to pushback facing North.',
          vietnamese: 'Được phép đẩy lui hướng mũi về phía Bắc.',
          pronunciationNotes: 'Phát âm "North" chuẩn âm /nɔːθ/, không đọc thành "Nót".'
        },
        groundTurn: {
          id: 'ch1-sc1-p2-g',
          order: 4,
          speaker: 'Ground',
          text: 'Pushback facing North. Release parking brakes.',
          vietnamese: 'Đẩy lui hướng Bắc. Yêu cầu xả phanh tay.',
          pronunciationNotes: 'Nhắc lại đúng hướng "North" và khẩu lệnh "Release parking brakes".'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p3-c',
          order: 5,
          speaker: 'Cockpit',
          text: 'Parking brakes released.',
          vietnamese: 'Phanh tay đã được xả.',
          pronunciationNotes: 'Đọc âm đuôi /t/ trong "released".'
        },
        groundTurn: {
          id: 'ch1-sc1-p3-g',
          order: 6,
          speaker: 'Ground',
          text: 'Commencing pushback. Clear to start Engine Number 2.',
          vietnamese: 'Bắt đầu đẩy tàu bay. Cho phép khởi động động cơ số 2.',
          pronunciationNotes: 'Phát âm chuẩn "Commencing" /kəˈmensɪŋ/ và "Engine Number 2".'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p4-c',
          order: 7,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 2.',
          vietnamese: 'Đang khởi động động cơ số 2.',
          pronunciationNotes: 'Đọc dứt khoát, âm "Starting".'
        },
        groundTurn: {
          id: 'ch1-sc1-p4-g',
          order: 8,
          speaker: 'Ground',
          text: 'N1 rotation - Engine Number 2.',
          vietnamese: 'Vòng quay trục N1 động cơ số 2 đang quay bình thường.',
          pronunciationNotes: 'Đọc rõ "N-One rotation".'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p5-c',
          order: 9,
          speaker: 'Cockpit',
          text: 'Check.',
          vietnamese: 'Đã kiểm tra xác nhận.',
          prowords: ['CHECK'],
          pronunciationNotes: 'Proword chuẩn ICAO: "Check".'
        },
        groundTurn: {
          id: 'ch1-sc1-p5-g',
          order: 10,
          speaker: 'Ground',
          text: 'Clear to start Engine Number 1.',
          vietnamese: 'Cho phép khởi động động cơ số 1.',
          pronunciationNotes: 'Rõ ràng, không vội vã: "Clear to start Engine Number 1".'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p6-c',
          order: 11,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 1.',
          vietnamese: 'Đang khởi động động cơ số 1.',
          pronunciationNotes: 'Âm thanh buồng lái chuẩn ICAO.'
        },
        groundTurn: {
          id: 'ch1-sc1-p6-g',
          order: 12,
          speaker: 'Ground',
          text: 'N1 rotation - Engine Number 1.',
          vietnamese: 'Vòng quay trục N1 động cơ số 1 đang quay bình thường.',
          pronunciationNotes: 'Quan sát và báo cáo đúng thời điểm.'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p7-c',
          order: 13,
          speaker: 'Cockpit',
          text: 'Check. Engines started.',
          vietnamese: 'Đã kiểm tra. Cả hai động cơ đã nổ tốt.',
          prowords: ['CHECK']
        },
        groundTurn: {
          id: 'ch1-sc1-p7-g',
          order: 14,
          speaker: 'Ground',
          text: 'Pushback complete. Set parking brakes.',
          vietnamese: 'Đẩy tàu bay hoàn tất. Yêu cầu cài phanh tay.',
          pronunciationNotes: 'Khẩu lệnh chuẩn: "Pushback complete. Set parking brakes".'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p8-c',
          order: 15,
          speaker: 'Cockpit',
          text: 'Parking brakes set.',
          vietnamese: 'Phanh tay đã cài.',
          pronunciationNotes: 'Âm đuôi /t/ trong "set".'
        },
        groundTurn: {
          id: 'ch1-sc1-p8-g',
          order: 16,
          speaker: 'Ground',
          text: 'Disconnecting ground equipment. Standby.',
          vietnamese: 'Đang ngắt kết nối thiết bị mặt đất. Chờ trong giây lát.',
          prowords: ['STANDBY'],
          pronunciationNotes: '"Disconnecting ground equipment. Standby".'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p9-c',
          order: 17,
          speaker: 'Cockpit',
          text: 'Start complete. Disconnect headset. Hand signals on right side.',
          vietnamese: 'Khởi động hoàn tất. Cho phép ngắt tai nghe. Ra tín hiệu tay bên phải.',
          pronunciationNotes: 'Lệnh ngắt kết nối từ Cơ trưởng.'
        },
        groundTurn: {
          id: 'ch1-sc1-p9-g',
          order: 18,
          speaker: 'Ground',
          text: 'Disconnecting headset. Hand signals on right side.',
          vietnamese: 'Đang ngắt tai nghe. Tín hiệu tay bên phải.',
          pronunciationNotes: 'Readback chính xác phía ra tín hiệu ("right side").'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch1-sc1-p10-c',
          order: 19,
          speaker: 'Cockpit',
          text: 'Roger. Have a safe day.',
          vietnamese: 'Đã nhận rõ. Chúc một ca làm việc an toàn.',
          prowords: ['ROGER']
        },
        groundTurn: {
          id: 'ch1-sc1-p10-g',
          order: 20,
          speaker: 'Ground',
          text: 'All clear. Steering pin removed. Goodbye.',
          vietnamese: 'Khu vực thông thoáng. Chốt điều hướng đã tháo. Tạm biệt.',
          pronunciationNotes: 'Câu chào tiêu chuẩn trước khi rút tai nghe.'
        }
      }
    ]
  },

  // CHAPTER 1 - SCENARIO 2
  {
    id: 'ch1-sc2',
    chapter: 1,
    chapterTitle: 'Chương 1: Quy trình Đẩy & Kéo Tàu Bay',
    title: 'Sự cố khẩn cấp: Gãy chốt an toàn cần kéo (Towbar Pin Shear)',
    difficulty: 'Advanced',
    aircraft: 'VN-A645 (Airbus A320)',
    flight: 'VJ152',
    location: 'Sân bay Nội Bài (HAN) - Vị trí đỗ F03',
    equipment: 'Cần kéo HYDROTOW A320 gắn xe đẩy',
    conditions: 'Tàu bay đang đẩy lùi chậm, chưa khởi động động cơ thì chốt an toàn (shear pin) bị đứt',
    abnormality: 'Đầu cần kéo tuột khỏi càng mũi tàu bay khi đang di chuyển',
    objective: 'Phát hiện sự cố, phát lệnh dừng khẩn cấp ngay lập tức, chèn bánh mũi và báo cáo theo ERP.',
    referenceDoc: 'Mục 1.2.3 - VJC-GOP-M-01 (Kế hoạch ứng phó khẩn nguy ERP)',
    rubricMaxScore: 25,
    prohibitedActions: [
      'Không được chần chừ hay dùng từ ngữ thông thường (phải hô lớn COCKPIT ALERT).',
      'Không tự ý di dời trang thiết bị khi chưa có sự cho phép của CRS/Đại diện hãng.',
      'Không được lại gần càng mũi trước khi tàu bay dừng hẳn và cài phanh.'
    ],
    handSignals: [
      { step: 'Dừng khẩn cấp', description: 'Hai tay vung mạnh lên quá đầu, bắt chéo thành hình chữ X dứt khoát' },
      { step: 'Chèn bánh', description: 'Hai tay đặt chụm ngang thắt lưng chỉ vào bánh xe' }
    ],
    explanationNotes: 'Khi chốt an toàn cần kéo bị gãy (shear pin broken), ưu tiên số 1 là con người và an toàn tàu bay. Headset man phải lập tức hô lệnh khẩn nguy trên bộ đàm: "STOP! STOP! COCKPIT ALERT! TOWBAR SEPARATED. APPLY BRAKE!" để phi công phanh khẩn cấp.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'COCKPIT ALERT, COCKPIT ALERT! STOP! STOP! Towbar separated. Apply brakes immediately!',
          vietnamese: 'CẢNH BÁO BUỒNG LÁI! DỪNG LẠI! DỪNG LẠI! Cần kéo đã tuột. Đạp phanh ngay lập tức!',
          pronunciationNotes: 'Hô to, dứt khoát, âm khẩn nguy: "COCKPIT ALERT! APPLY BRAKES IMMEDIATELY!".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Brakes applied! Aircraft stopped.',
          vietnamese: 'Đã đạp phanh! Tàu bay đã dừng hẳn.',
          pronunciationNotes: 'Giọng bình tĩnh, dứt khoát.'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Set parking brake. Confirm parking brake set.',
          vietnamese: 'Cài phanh tay. Yêu cầu xác nhận phanh tay đã cài.',
          prowords: ['CONFIRM'],
          pronunciationNotes: 'Ngắn gọn, rõ: "Set parking brake. Confirm parking brake set".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Parking brake set. What is the status down there?',
          vietnamese: 'Phanh tay đã cài. Tình trạng phía dưới thế nào?',
          pronunciationNotes: '"Parking brake set".'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Towbar safety shear pin broken. Tug vehicle is moving clear.',
          vietnamese: 'Chốt cắt an toàn cần kéo đã gãy. Xe kéo đang di chuyển tách rời an toàn.',
          pronunciationNotes: 'Rõ ràng: "Towbar safety shear pin broken".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Roger. Ensure nose gear is chocked before any inspection.',
          vietnamese: 'Đã nhận rõ. Đảm bảo chèn bánh mũi trước khi kiểm tra.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Nose gear chocks in place. All movement ceased.',
          vietnamese: 'Đã đặt chèn bánh mũi xong. Toàn bộ hoạt động di chuyển đã dừng.',
          pronunciationNotes: '"Nose gear chocks in place".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Copied. Are there any injuries or aircraft damage visible?',
          vietnamese: 'Đã nhận thông tin. Có ai bị thương hoặc có hư hỏng tàu bay nhìn thấy không?'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Negative. No personnel injury. Visual inspection of nose gear in progress.',
          vietnamese: 'Không có. Không ai bị thương. Đang tiến hành kiểm tra trực quan càng mũi.',
          prowords: ['NEGATIVE']
        },
        cockpitTurn: {
          id: 'ch1-sc2-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Understood. Contact CRS and Ramp Supervisor immediately.',
          vietnamese: 'Đã hiểu. Thông báo kỹ sư CRS và Giám sát sân đỗ ngay lập tức.'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Wilco. Ground Operations and CRS are notified. Standing by.',
          vietnamese: 'Sẽ thực hiện ngay. Điều hành mặt đất và CRS đã được thông báo. Đang chờ máy.',
          prowords: ['WILCO', 'STANDBY']
        },
        cockpitTurn: {
          id: 'ch1-sc2-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Advise when replacement towbar or towbarless tug is available.',
          vietnamese: 'Báo lại khi có cần kéo thay thế hoặc xe kéo không cần.'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'CRS is on stand. Nose gear inspected and confirmed airworthy.',
          vietnamese: 'Kỹ sư CRS đã có mặt. Càng mũi đã kiểm tra và xác nhận đủ điều kiện bay.',
          pronunciationNotes: 'Đọc chuẩn "airworthy" /ˈeəˌwɜː.ði/.'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Good. New towbar connected?',
          vietnamese: 'Tốt. Cần kéo mới đã gắn xong chưa?'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Affirm. Replacement towbar connected and locked. Chocks removed.',
          vietnamese: 'Đúng vậy. Cần kéo thay thế đã kết nối và khóa chặt. Đã rút chèn.',
          prowords: ['AFFIRM']
        },
        cockpitTurn: {
          id: 'ch1-sc2-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Release parking brakes. Ready to resume pushback.',
          vietnamese: 'Xả phanh tay. Sẵn sàng tiếp tục đẩy lui.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Brakes released confirmed. Resuming pushback.',
          vietnamese: 'Xác nhận đã xả phanh. Đang tiếp tục đẩy lui.',
          pronunciationNotes: '"Resuming pushback".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Pushback complete. Set parking brakes.',
          vietnamese: 'Đẩy hoàn tất. Cài phanh tay.'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch1-sc2-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Brakes set confirmed. Disconnecting equipment. Incident report filed.',
          vietnamese: 'Xác nhận phanh đã cài. Đang tháo trang thiết bị. Báo cáo sự cố đã lập.',
          pronunciationNotes: '"Incident report filed. All clear".'
        },
        cockpitTurn: {
          id: 'ch1-sc2-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Roger. Thank you for the quick reaction. Disconnect headset.',
          vietnamese: 'Đã nhận rõ. Cảm ơn vì xử lý nhanh chóng. Ngắt tai nghe.',
          prowords: ['ROGER']
        }
      }
    ]
  },

  // CHAPTER 2 - SCENARIO 3
  {
    id: 'ch2-sc1',
    chapter: 2,
    chapterTitle: 'Chương 2: Các Hình Thức Đàm Thoại Với Tổ Bay',
    title: 'Tàu bay đến: Đèn BEACON chưa tắt & Kết nối GPU / ACU',
    difficulty: 'Intermediate',
    aircraft: 'VN-A632 (Airbus A320)',
    flight: 'VJ628',
    location: 'Sân bay Đà Nẵng (DAD) - Vị trí đỗ B12',
    equipment: 'Xe cấp điện mặt đất GPU và xe điều hòa ACU',
    conditions: 'Tàu bay vừa lăn vào bến đỗ, đã chèn bánh nhưng đèn BEACON chống va chạm vẫn chớp sáng',
    abnormality: 'Đèn chớp đỏ chống va chạm (BEACON) vẫn bật sau khi vào bến',
    objective: 'Thực hiện quy trình 3 bước: thiết lập đàm thoại -> xử lý đèn BEACON an toàn -> kết nối GPU/ACU.',
    referenceDoc: 'Mục 2.2 - VJC-VJAA-M-125 (Normal Arrival)',
    rubricMaxScore: 20,
    prohibitedActions: [
      'Tuyệt đối cấm nhân viên mặt đất tiếp cận vùng nguy hiểm (cánh, động cơ, họng hút) khi đèn BEACON chưa tắt.',
      'Không được kết nối cáp điện GPU khi chưa có sự xác nhận từ tổ bay.'
    ],
    explanationNotes: 'Đèn BEACON (đèn đỏ chớp) báo hiệu động cơ vẫn đang chạy hoặc cánh quạt/cơ phận có thể chuyển động bất kỳ lúc nào. Xác nhận BEACON OFF là nguyên tắc an toàn bắt buộc trước khi cho phép nhân viên tiếp cận kết nối GPU/ACU.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Ground to Cockpit.',
          vietnamese: 'Mặt đất gọi buồng lái.',
          pronunciationNotes: 'Âm thanh tự tin, rõ ràng: "Ground to Cockpit".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Cockpit to Ground. Go ahead.',
          vietnamese: 'Buồng lái nghe mặt đất. Xin mời nói.',
          pronunciationNotes: '"Go ahead" - cụm từ hàng không quen thuộc.'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Chocks in place.',
          vietnamese: 'Chèn bánh đã đặt đúng vị trí.',
          pronunciationNotes: 'Đọc chuẩn âm /tʃɒks/ "Chocks in place".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Brakes released.',
          vietnamese: 'Phanh đã nhả.'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Ground to Cockpit - BEACON lights still ON.',
          vietnamese: 'Mặt đất báo buồng lái: Đèn BEACON vẫn đang BẬT.',
          pronunciationNotes: 'Nhấn rõ: "BEACON lights still ON".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Roger. BEACON set OFF.',
          vietnamese: 'Đã nhận rõ. Đèn BEACON đã được TẮT.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'BEACON OFF confirmed. Thank you.',
          vietnamese: 'Xác nhận đèn BEACON đã tắt an toàn. Cảm ơn tổ bay.',
          prowords: ['CONFIRM'],
          pronunciationNotes: '"BEACON OFF confirmed. Thank you".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Please connect Ground Power Unit and Air Conditioning Unit.',
          vietnamese: 'Vui lòng kết nối xe điện GPU và xe điều hòa ACU.'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'The External Ground Power Unit is available.',
          vietnamese: 'Xe nguồn điện mặt đất GPU đã sẵn sàng kết nối.',
          pronunciationNotes: '"The External Ground Power Unit is available".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Supply External Ground Power.',
          vietnamese: 'Cho cấp điện mặt đất.'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'External Ground Power is available - connected.',
          vietnamese: 'Điện mặt đất đã sẵn sàng - đã kết nối thành công.',
          pronunciationNotes: '"External Ground Power is available - connected".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Power received. What about the air conditioning?',
          vietnamese: 'Đã nhận nguồn điện. Còn điều hòa thì sao?'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'The External Air Conditioning Unit is available.',
          vietnamese: 'Xe cấp khí điều hòa ACU đã sẵn sàng.',
          pronunciationNotes: '"The External Air Conditioning Unit is available".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Supply External Air Conditioning Flow.',
          vietnamese: 'Bắt đầu cấp lưu lượng khí lạnh điều hòa.'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'External Air Conditioning Flow is available - connected.',
          vietnamese: 'Khí lạnh điều hòa đã cấp - đã kết nối ống dẫn.',
          pronunciationNotes: '"External Air Conditioning Flow is available - connected".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Airflow checked. Ready for passenger disembarkation.',
          vietnamese: 'Đã kiểm tra luồng khí. Sẵn sàng cho hành khách xuống máy bay.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Passenger stairs positioning in progress.',
          vietnamese: 'Xe thang đón khách đang tiếp cận vị trí cửa.',
          pronunciationNotes: '"Passenger stairs positioning in progress".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Roger. Keep monitoring ground equipment status.',
          vietnamese: 'Đã nhận rõ. Tiếp tục giám sát trạng thái thiết bị mặt đất.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc1-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Wilco. Ground crew standing by on headset.',
          vietnamese: 'Sẽ thực hiện. Nhân viên mặt đất tiếp tục giữ liên lạc tai nghe.',
          prowords: ['WILCO', 'STANDBY'],
          pronunciationNotes: '"Wilco. Ground crew standing by on headset".'
        },
        cockpitTurn: {
          id: 'ch2-sc1-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Check. Thank you Ground.',
          vietnamese: 'Đã xác nhận. Cảm ơn mặt đất.',
          prowords: ['CHECK']
        }
      }
    ]
  },

  // CHAPTER 2 - SCENARIO 4
  {
    id: 'ch2-sc2',
    chapter: 2,
    chapterTitle: 'Chương 2: Các Hình Thức Đàm Thoại Với Tổ Bay',
    title: 'Khởi hành COMAC C909: Sự cố cần kéo + Nổ máy bằng GPU/ASU khi APU hỏng',
    difficulty: 'Advanced',
    aircraft: 'COMAC C909 (ARJ21)',
    flight: 'VJ388',
    location: 'Sân bay Phú Quốc (PQC) - Sân đỗ',
    equipment: 'Xe kéo cần + Xe khí nén khởi động ASU + Xe điện GPU',
    conditions: 'APU hỏng (INOP), cần dùng khí nén ASU khởi động động cơ số 2 trước',
    abnormality: 'Cần kéo gặp trục trặc giữa chừng phải dừng thay thế + APU hỏng',
    objective: 'Nắm vững đàm thoại đặc thù tàu bay COMAC C909 và quy trình khởi động động cơ bằng ASU khi APU hỏng.',
    referenceDoc: 'Mục 2.3.3 & 2.3.4 - VJC-VJAA-M-125 (COMAC C909)',
    rubricMaxScore: 25,
    prohibitedActions: [
      'Không khởi động động cơ 1 trước khi APU hỏng (động cơ số 2 bên cánh phải gần cổng ASU phải nổ trước).',
      'Không ngắt kết nối ASU/GPU khi chưa có xác nhận vòng quay và lệnh từ phi công.'
    ],
    explanationNotes: 'Trên COMAC C909 khi APU INOP, xe khí nén ASU nối vào hông phải. Do đó động cơ số 2 phải được khởi động trước. Sau khi động cơ 2 ổn định, tháo ASU và GPU, rồi buồng lái dùng khí trích chéo (cross-bleed) để nổ động cơ 1.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Ground to Cockpit - Please set parking brake. Towbar problem.',
          vietnamese: 'Mặt đất gọi buồng lái: Vui lòng cài phanh đỗ. Cần kéo có trục trặc.',
          pronunciationNotes: '"Ground to Cockpit - Please set parking brake. Towbar problem".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Parking brake set. Standing by.',
          vietnamese: 'Phanh đỗ đã cài. Đang chờ máy.',
          prowords: ['STANDBY']
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Ground to Cockpit - Towbar replaced and reconnected. Please release parking brake.',
          vietnamese: 'Mặt đất báo buồng lái: Cần kéo đã thay và nối lại xong. Vui lòng nhả phanh đỗ.',
          pronunciationNotes: '"Towbar replaced and reconnected. Please release parking brake".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Brakes released. Ready to continue pushback.',
          vietnamese: 'Phanh đã nhả. Sẵn sàng tiếp tục đẩy lui.'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Commencing pushback.',
          vietnamese: 'Bắt đầu đẩy tàu bay.',
          pronunciationNotes: '"Commencing pushback".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Roger. Remind Ground: APU is INOP, we require ASU and GPU for start.',
          vietnamese: 'Đã nhận rõ. Nhắc mặt đất: APU bị hỏng, chúng tôi cần ASU và GPU để nổ máy.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Pushback complete. Set parking brake.',
          vietnamese: 'Đẩy hoàn tất. Yêu cầu cài phanh đỗ.',
          pronunciationNotes: '"Pushback complete. Set parking brake".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Brakes set.',
          vietnamese: 'Phanh đã cài.'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'External bleed ASU connected. External power GPU connected. Clear to start Engine Number 2.',
          vietnamese: 'Đã nối khí ASU. Đã nối điện GPU. Cho phép nổ động cơ số 2.',
          pronunciationNotes: '"External bleed ASU connected. External power GPU connected. Clear to start Engine Number 2".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 2.',
          vietnamese: 'Bắt đầu khởi động động cơ số 2.'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'N1 rotation - Engine Number 2.',
          vietnamese: 'Vòng quay N1 động cơ 2 đang quay tốt.',
          pronunciationNotes: '"N1 rotation - Engine Number 2".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Engine Number 2 started. Please remove external ASU and GPU.',
          vietnamese: 'Động cơ số 2 đã nổ. Vui lòng ngắt và rút xe ASU cùng GPU.'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'Roger. Disconnecting external bleed and power. Standby.',
          vietnamese: 'Đã nhận rõ. Đang ngắt ống khí nén và cáp nguồn điện. Chờ máy.',
          prowords: ['ROGER', 'STANDBY'],
          pronunciationNotes: '"Disconnecting external bleed and power. Standby".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Standing by.',
          vietnamese: 'Đang chờ máy.',
          prowords: ['STANDBY']
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'External bleed and power disconnected. Doors closed. Clear to start Engine Number 1.',
          vietnamese: 'Đã ngắt khí và điện. Cửa pa-nen đã đóng. Cho phép khởi động động cơ số 1.',
          pronunciationNotes: '"External bleed and power disconnected. Clear to start Engine Number 1".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 1 with cross-bleed.',
          vietnamese: 'Đang nổ động cơ số 1 bằng khí trích chéo.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'N1 rotation - Engine Number 1.',
          vietnamese: 'Vòng quay N1 động cơ số 1 đang quay bình thường.',
          pronunciationNotes: '"N1 rotation - Engine Number 1".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Engine Number 1 started. Start complete. Disconnect headset.',
          vietnamese: 'Động cơ 1 đã nổ. Hoàn tất khởi động. Cho phép ngắt tai nghe.'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch2-sc2-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Disconnecting. Hand signals on right side. All clear. Goodbye.',
          vietnamese: 'Đang ngắt tai nghe. Ra tín hiệu tay bên phải. Mọi thứ thông thoáng. Tạm biệt.',
          pronunciationNotes: '"Disconnecting. Hand signals on right side. All clear. Goodbye".'
        },
        cockpitTurn: {
          id: 'ch2-sc2-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Hand signals on right side copied. Goodbye.',
          vietnamese: 'Đã nhận lệnh tín hiệu tay bên phải. Tạm biệt.'
        }
      }
    ]
  },

  // CHAPTER 3 - SCENARIO 5
  {
    id: 'ch3-sc1',
    chapter: 3,
    chapterTitle: 'Chương 3: Quy Trình Phục Vụ Mặt Đất',
    title: 'Kiểm tra vòng ngoài: Phát hiện vết xước bất thường tại cánh đuôi ngang',
    difficulty: 'Intermediate',
    aircraft: 'VN-A651 (Airbus A320neo)',
    flight: 'VJ701',
    location: 'Sân bay Cần Thơ (VCA) - Quay đầu (Turnaround)',
    equipment: 'Đèn pin chuyên dụng, thiết bị đo và chụp ảnh hiện trường',
    conditions: 'Khách đến đã xuống hết, khách đi đang chuẩn bị lên tàu bay',
    abnormality: 'Vết xước kim loại sâu và bất thường ở cánh đuôi ngang bên trái (Left Horizontal Stabilizer)',
    objective: 'Phát hiện bất thường, đình chỉ đón khách ngay lập tức, báo cáo tổ bay và kỹ sư CRS để đánh giá điều kiện bay.',
    referenceDoc: 'Mục 3.2 - VJC-VJAA-M-125 & VJC-GOP-M-01',
    rubricMaxScore: 20,
    prohibitedActions: [
      'Tuyệt đối KHÔNG cho phép hành khách tiếp tục lên tàu bay trong khi chờ kỹ sư CRS đánh giá.',
      'Nhân viên mặt đất GO không được tự ý kết luận máy bay vẫn bay được.'
    ],
    explanationNotes: 'Theo quy định VJC: CHỈ KỸ SƯ CÓ BẰNG CRS mới có thẩm quyền thẩm định mức độ hư hại và ký xác nhận đủ điều kiện bay. Trong lúc chờ CRS kiểm tra, KHÔNG ĐƯỢC cho khách lên máy bay.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Ground to Cockpit. Urgent notice.',
          vietnamese: 'Mặt đất gọi buồng lái. Xin thông báo gấp.',
          pronunciationNotes: '"Ground to Cockpit. Urgent notice".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Cockpit to Ground. Go ahead.',
          vietnamese: 'Buồng lái nghe mặt đất. Xin mời báo cáo.'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'During walk-around inspection, we found a significant scratch on left horizontal stabilizer.',
          vietnamese: 'Trong quá trình kiểm tra vòng ngoài, phát hiện vết xước sâu bất thường tại cánh đuôi ngang trái.',
          pronunciationNotes: '"horizontal stabilizer" /ˌhɒr.ɪˈzɒn.təl ˈsteɪ.bəl.aɪ.zər/.'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Acknowledge scratch on left stabilizer. Have you halted passenger boarding?',
          vietnamese: 'Xác nhận vết xước cánh đuôi ngang trái. Anh đã cho dừng đón khách chưa?',
          prowords: ['ACKNOWLEDGE']
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Affirm. Boarding is halted immediately. Passengers are kept in terminal gate.',
          vietnamese: 'Đúng vậy. Đã dừng đón khách ngay lập tức. Khách đang đợi tại nhà ga.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Boarding is halted immediately".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Good decision. Has the CRS engineer been notified?',
          vietnamese: 'Quyết định chính xác. Đã báo kỹ sư CRS chưa?'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Affirm. CRS engineer and VJC representative are heading to the aircraft with inspection kit.',
          vietnamese: 'Đã báo. Kỹ sư CRS và đại diện hãng đang di chuyển ra tàu bay cùng bộ thiết bị kiểm tra.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"CRS engineer and VJC representative are heading to the aircraft".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Did you photograph the scratch from multiple angles?',
          vietnamese: 'Anh đã chụp ảnh vết xước từ nhiều góc độ chưa?'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Affirm. Multiple photos and scale measurements have been recorded.',
          vietnamese: 'Đúng vậy. Đã chụp nhiều góc độ và đo kích thước vết xước lưu hồ sơ.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Multiple photos and scale measurements have been recorded".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Standby on headset while CRS conducts evaluation.',
          vietnamese: 'Tiếp tục chờ máy trên tai nghe trong lúc CRS thẩm định.',
          prowords: ['STANDBY']
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Wilco. Ground crew standing by on headset.',
          vietnamese: 'Rõ. Nhân viên mặt đất tiếp tục giữ liên lạc.',
          prowords: ['WILCO', 'STANDBY'],
          pronunciationNotes: '"Wilco. Ground crew standing by on headset".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Ground, what is CRS preliminary assessment?',
          vietnamese: 'Mặt đất nghe, kết quả đánh giá sơ bộ của CRS thế nào?'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'CRS confirmed scratch depth is within SRM allowable limits. Temporary repair recorded.',
          vietnamese: 'CRS xác nhận độ sâu vết xước nằm trong giới hạn cho phép của tài liệu SRM. Đã ghi nhận sửa chữa tạm.',
          pronunciationNotes: '"SRM allowable limits" /əˈlaʊ.ə.bəl ˈlɪm.ɪts/.'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Has the CRS signed the aircraft Technical Logbook?',
          vietnamese: 'CRS đã ký sổ nhật trình kỹ thuật Techlog chưa?'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Affirm. Techlog signed. Aircraft is released and airworthy.',
          vietnamese: 'Đã ký. Sổ Techlog đã ký xong. Tàu bay được phép khai thác.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Techlog signed. Aircraft is released and airworthy".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p8-c',
          order: 9,
          speaker: 'Cockpit',
          text: 'Very good. You may authorize passenger boarding to resume now.',
          vietnamese: 'Rất tốt. Anh có thể cho phép tiếp tục đón khách lên tàu bay.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Wilco. Notifying boarding staff to resume passenger boarding.',
          vietnamese: 'Sẽ thực hiện. Đang báo nhân viên phục vụ hành khách cho khách lên.',
          prowords: ['WILCO'],
          pronunciationNotes: '"Notifying boarding staff to resume passenger boarding".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Maintain headset contact until pre-departure walk-around is complete.',
          vietnamese: 'Duy trì liên lạc tai nghe đến khi hoàn tất kiểm tra trước giờ khởi hành.'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc1-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Roger. Ground headset monitoring all activities.',
          vietnamese: 'Đã nhận rõ. Mặt đất đang theo dõi toàn bộ hoạt động.',
          prowords: ['ROGER'],
          pronunciationNotes: '"Roger. Ground headset monitoring all activities".'
        },
        cockpitTurn: {
          id: 'ch3-sc1-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Check. Thank you Ground.',
          vietnamese: 'Đã xác nhận. Cảm ơn mặt đất.',
          prowords: ['CHECK']
        }
      }
    ]
  },

  // CHAPTER 3 - SCENARIO 6
  {
    id: 'ch3-sc2',
    chapter: 3,
    chapterTitle: 'Chương 3: Quy Trình Phục Vụ Mặt Đất',
    title: 'Quy trình đàm thoại nạp nhiên liệu khi có hành khách trên khoang',
    difficulty: 'Advanced',
    aircraft: 'VN-A677 (Airbus A321)',
    flight: 'VJ325 (SGN-PQC)',
    location: 'Sân bay Tân Sơn Nhất (SGN) - Vị trí đỗ',
    equipment: 'Xe tra nạp dầu Petrolimex Aviation số hiệu SGN-32027',
    conditions: 'Khách đang lên/xuống tàu bay, đang nạp nhiên liệu Jet A-1',
    objective: 'Duy trì liên lạc hai chiều liên tục qua headset, kiểm tra chênh lệch lượng dầu (uplift discrepancy) và báo cáo thông số.',
    referenceDoc: 'Mục 8.6 - VJC-GOP-M-001 & Bảng điều khiển 800VU',
    rubricMaxScore: 20,
    prohibitedActions: [
      'Không được ngắt liên lạc tai nghe trong suốt thời gian nạp dầu khi có khách.',
      'Không được hút thuốc hoặc để thiết bị tạo tia lửa trong vùng an toàn 3m tính từ khớp nối và lỗ thông hơi bình dầu.'
    ],
    explanationNotes: 'Khi nạp dầu có hành khách trên khoang, nhân viên headset GO phải duy trì liên lạc 2 chiều với buồng lái để xử lý tình huống khẩn cấp sơ tán khách khi có sự cố tràn dầu hoặc cháy.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Ground to Cockpit. Refueling team is ready to connect fuel hose.',
          vietnamese: 'Mặt đất gọi buồng lái: Đội nạp nhiên liệu đã sẵn sàng nối ống tra nạp.',
          pronunciationNotes: '"Ground to Cockpit. Refueling team is ready to connect fuel hose".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Cockpit to Ground. Confirm passengers on board, maintain two-way headset communication.',
          vietnamese: 'Buồng lái nghe mặt đất. Xác nhận có khách trên khoang, duy trì liên lạc 2 chiều qua tai nghe.',
          prowords: ['CONFIRM']
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Wilco. Fire safety zone clear. Cabin emergency exits are unobstructed.',
          vietnamese: 'Rõ. Vùng an toàn phòng cháy đã thông thoáng. Các cửa thoát hiểm khoang khách không bị cản trở.',
          prowords: ['WILCO'],
          pronunciationNotes: '"Fire safety zone clear. Cabin emergency exits are unobstructed".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Copied. Target fuel load is 7,500 kilograms. Commencing fuel flow.',
          vietnamese: 'Đã nhận. Lượng dầu cần nạp mục tiêu là 7.500 kg. Cho phép bắt đầu bơm dầu.'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Fuel flow started. Panel 800VU tested normal.',
          vietnamese: 'Bắt đầu nạp dầu. Bảng điều khiển 800VU đã kiểm tra hoạt động bình thường.',
          pronunciationNotes: '"Fuel flow started. Panel 800VU tested normal".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Check. Monitor fuel high level cut-off sensors.',
          vietnamese: 'Đã kiểm tra. Giám sát các cảm biến tự ngắt khi đầy bình (HI LVL).',
          prowords: ['CHECK']
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'High level test verified. Refueling in progress at 450 liters per minute.',
          vietnamese: 'Đã kiểm tra cảm biến HI LVL. Đang nạp với lưu lượng 450 lít/phút.',
          pronunciationNotes: '"High level test verified".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Roger. Report immediately if any fuel leak or odor is detected.',
          vietnamese: 'Đã nhận rõ. Báo cáo ngay lập tức nếu phát hiện rò rỉ hoặc mùi dầu nhiên liệu.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Wilco. Surrounding area is strictly monitored.',
          vietnamese: 'Rõ. Khu vực xung quanh đang được giám sát chặt chẽ.',
          prowords: ['WILCO'],
          pronunciationNotes: '"Wilco. Surrounding area is strictly monitored".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p4-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Ground, what is current fuel quantity on panel?',
          vietnamese: 'Mặt đất nghe, lượng dầu hiện tại hiển thị trên bảng là bao nhiêu?'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Current actual quantity is 6,800 kilograms. Nearing target.',
          vietnamese: 'Lượng dầu thực tế hiện tại là 6.800 kg. Sắp đạt mức mục tiêu.',
          pronunciationNotes: '"Current actual quantity is 6,800 kilograms".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Roger. Standing by for auto shut-off.',
          vietnamese: 'Đã nhận rõ. Chờ ngắt tự động.',
          prowords: ['ROGER', 'STANDBY']
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'Refueling completed. END light green illuminated on 800VU.',
          vietnamese: 'Đã nạp dầu xong. Đèn END màu xanh lá đã sáng trên bảng 800VU.',
          pronunciationNotes: '"Refueling completed. END light green illuminated on 800VU".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Confirmed END light. Please state fuel delivery bill figures.',
          vietnamese: 'Xác nhận đèn END. Vui lòng đọc số liệu trên phiếu tra nạp dầu.'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Fuel uplift 2,600 kilograms. Observed density 0.7820. Discrepancy is 0.4%, within 2% limit.',
          vietnamese: 'Lượng nạp thêm 2.600 kg. Tỷ trọng 0.7820. Độ chênh lệch 0,4%, nằm trong giới hạn 2%.',
          pronunciationNotes: '"Fuel uplift 2,600 kilograms. Discrepancy is 0.4%".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Figures match cockpit indications. Please disconnect fuel hose.',
          vietnamese: 'Số liệu khớp với đồng hồ buồng lái. Vui lòng ngắt ống nạp nhiên liệu.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Fuel hose disconnected. Fuel panel door closed and secured.',
          vietnamese: 'Đã tháo ống nạp dầu. Cửa hầm nạp nhiên liệu đã đóng và chốt chặt an toàn.',
          pronunciationNotes: '"Fuel hose disconnected. Fuel panel door closed and secured".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Roger. Bowser cleared from aircraft?',
          vietnamese: 'Đã nhận rõ. Xe bồn nạp dầu đã di chuyển cách ly khỏi tàu bay chưa?',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch3-sc2-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Affirm. Fuel bowser moving away to equipment area. All clear.',
          vietnamese: 'Đúng vậy. Xe bồn đang rút về khu vực đỗ trang thiết bị. Mọi thứ an toàn.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Affirm. Fuel bowser moving away to equipment area. All clear".'
        },
        cockpitTurn: {
          id: 'ch3-sc2-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Check. Thank you for safe refueling operation.',
          vietnamese: 'Đã xác nhận. Cảm ơn vì quy trình nạp dầu an toàn.',
          prowords: ['CHECK']
        }
      }
    ]
  },

  // CHAPTER 4 - SCENARIO 7
  {
    id: 'ch4-sc1',
    chapter: 4,
    chapterTitle: 'Chương 4: An Toàn Trong Khai Thác Mặt Đất',
    title: 'Lệnh đình chỉ do giông sét (Ramp SHUTDOWN) - Xử lý 3 nhiệm vụ đồng thời',
    difficulty: 'Advanced',
    aircraft: 'VN-A641 (Stand A06) / VN-A632 (Stand B12) / VN-A650 (Stand C03)',
    flight: 'VJ214 / VJ380 / VJ198',
    location: 'Sân bay Tân Sơn Nhất (SGN) - Giông sét trong bán kính 6 km',
    equipment: 'Xe kéo đã kết nối, xe nạp dầu, xe thang hành khách ngoài trời',
    conditions: 'Đài chỉ huy phát lệnh Ramp SHUTDOWN do giông sét trong phạm vi 6km lúc 14:30',
    abnormality: 'Đình chỉ khẩn cấp toàn bộ hoạt động trên sân đỗ vì nguy cơ sét đánh',
    objective: 'Xác định thứ tự ưu tiên xử lý: Con người > Nhiên liệu > Phương tiện cơ giới và tháo tai nghe phòng sét truyền.',
    referenceDoc: 'Chương 4 - VJC-VJAA-M-125 & Quy định an toàn GOM 6.2.2',
    rubricMaxScore: 25,
    prohibitedActions: [
      'Không được tiếp tục đeo tai nghe có dây dưới trời giông sét (nguy cơ truyền dẫn điện giật chết người).',
      'Không cho hành khách đứng trú dưới bụng cánh máy bay.',
      'Không được tự ý khôi phục hoạt động khi chưa có thông báo ALL-CLEAR chính thức từ Ramp Control.'
    ],
    explanationNotes: 'Thứ tự ưu tiên xử lý khẩn nguy khi có SHUTDOWN giông sét: (1) Hành khách ngoài trời đi thang bộ tại C03 phải hướng dẫn vào nhà ga ngay; (2) Dừng nạp nhiên liệu tại B12 và ngắt tai nghe; (3) Giữ nguyên xe đẩy tại A06 và tìm nơi trú ẩn an toàn.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'COCKPIT ALERT! Ramp Control has issued immediate lightning SHUTDOWN.',
          vietnamese: 'CẢNH BÁO BUỒNG LÁI! Điều hành sân đỗ vừa phát lệnh ĐÌNH CHỈ KHẨN CẤP do giông sét.',
          pronunciationNotes: '"Ramp Control has issued immediate lightning SHUTDOWN".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Acknowledge lightning SHUTDOWN. What are your immediate actions?',
          vietnamese: 'Xác nhận lệnh đình chỉ do sét. Các hành động xử lý tức thời của anh là gì?',
          prowords: ['ACKNOWLEDGE']
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Priority one: Halting outdoor passenger boarding at Stand C03 and guiding passengers inside.',
          vietnamese: 'Ưu tiên số 1: Dừng đón khách ngoài trời ở vị trí C03 và hướng dẫn hành khách vào nhà ga.',
          pronunciationNotes: '"Halting outdoor passenger boarding and guiding passengers inside".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Correct. Do NOT allow passengers to shelter under the aircraft wing.',
          vietnamese: 'Chính xác. Tuyệt đối không để hành khách trú mưa dưới cánh máy bay.'
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Affirm. Passengers guided to terminal via shortest sheltered path.',
          vietnamese: 'Đúng vậy. Đang dẫn khách vào nhà ga theo lối có mái che gần nhất.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Passengers guided to terminal via shortest sheltered path".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'What about refueling at Stand B12 and pushback at Stand A06?',
          vietnamese: 'Còn việc nạp dầu ở B12 và đẩy tàu bay ở A06 xử lý ra sao?'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Refueling at B12 stopped immediately. Valves closed. Fuel operator moving to shelter.',
          vietnamese: 'Nạp dầu tại B12 đã dừng ngay. Đã đóng van. Nhân viên nạp dầu đang vào nơi trú ẩn.',
          pronunciationNotes: '"Refueling at B12 stopped immediately. Valves closed".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'And our pushback here at Stand A06?',
          vietnamese: 'Còn đẩy tàu bay của chúng tôi ở vị trí A06?'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Pushback suspended. Aircraft remains on stand. Tug brakes set.',
          vietnamese: 'Đình chỉ đẩy lui. Tàu bay giữ nguyên vị trí đỗ. Xe kéo đã cài phanh đỗ.',
          pronunciationNotes: '"Pushback suspended. Aircraft remains on stand".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Understood. Parking brakes are set in cockpit.',
          vietnamese: 'Đã hiểu. Phanh đỗ trong buồng lái đã cài.'
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Safety notice: Headset operator must disconnect headset now to prevent lightning strike hazard.',
          vietnamese: 'Cảnh báo an toàn: Nhân viên mặt đất phải tháo tai nghe ngay để phòng nguy cơ sét đánh truyền dẫn.',
          pronunciationNotes: '"Must disconnect headset now to prevent lightning strike hazard".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Approved. Disconnect headset and take shelter immediately.',
          vietnamese: 'Đồng ý. Ngắt tai nghe và di chuyển vào nơi trú ẩn ngay lập tức.',
          prowords: ['APPROVED']
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'Disconnecting headset. We will communicate via VHF radio frequency once all-clear.',
          vietnamese: 'Đang ngắt tai nghe. Chúng tôi sẽ liên lạc qua tần số bộ đàm VHF khi có thông báo an toàn.',
          pronunciationNotes: '"Disconnecting headset. Communicate via VHF radio frequency".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Roger. Stay safe down there.',
          vietnamese: 'Đã nhận rõ. Giữ an toàn phía dưới.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Cockpit',
        cockpitTurn: {
          id: 'ch4-sc1-p8-c',
          order: 15,
          speaker: 'Cockpit',
          text: 'Cockpit to Ground on VHF. Lightning has passed. Did Ramp Control cancel SHUTDOWN?',
          vietnamese: 'Buồng lái gọi mặt đất trên VHF. Sấm sét đã qua. Điều hành sân đỗ đã hủy lệnh đình chỉ chưa?'
        },
        groundTurn: {
          id: 'ch4-sc1-p8-g',
          order: 16,
          speaker: 'Ground',
          text: 'Negative. No official all-clear notice yet. All operations remain halted.',
          vietnamese: 'Chưa có. Chưa có thông báo an toàn chính thức. Mọi hoạt động vẫn tiếp tục tạm dừng.',
          prowords: ['NEGATIVE'],
          pronunciationNotes: '"Negative. No official all-clear notice yet".'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Ramp Control officially issued ALL-CLEAR. Operations authorized to resume.',
          vietnamese: 'Điều hành sân đỗ vừa phát lệnh ALL-CLEAR chính thức. Cho phép nối lại hoạt động.',
          pronunciationNotes: '"Ramp Control officially issued ALL-CLEAR".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Roger. Reconnect headset when safe and confirm pushback preparation.',
          vietnamese: 'Đã nhận rõ. Kết nối lại tai nghe khi an toàn và xác nhận chuẩn bị đẩy lui.',
          prowords: ['ROGER']
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc1-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Headset reconnected. Stand clear. Ready to resume pushback sequence.',
          vietnamese: 'Tai nghe đã kết nối lại. Vị trí an toàn. Sẵn sàng tiếp tục quy trình đẩy lui.',
          pronunciationNotes: '"Headset reconnected. Ready to resume pushback sequence".'
        },
        cockpitTurn: {
          id: 'ch4-sc1-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Affirm. Let us complete ground check.',
          vietnamese: 'Đúng vậy. Hãy hoàn tất kiểm tra mặt đất.',
          prowords: ['AFFIRM']
        }
      }
    ]
  },

  // CHAPTER 4 - SCENARIO 8
  {
    id: 'ch4-sc2',
    chapter: 4,
    chapterTitle: 'Chương 4: An Toàn Trong Khai Thác Mặt Đất',
    title: 'Sự cố xe thiết bị vi phạm vùng an toàn cánh tàu bay (GSE Safety Breach)',
    difficulty: 'Intermediate',
    aircraft: 'VN-A690 (Airbus A321neo)',
    flight: 'VJ270',
    location: 'Sân bay Đà Nẵng (DAD) - Vị trí đỗ 22',
    equipment: 'Xe kéo hàng bưu phẩm và xe nâng hàng',
    conditions: 'Tàu bay đang chuẩn bị đẩy lui thì xe chở hàng băng ngang vi phạm khoảng cách an toàn 3m',
    abnormality: 'Phương tiện mặt đất vi phạm tĩnh không an toàn cánh phải',
    objective: 'Cảnh báo khẩn cấp, ngăn chặn va chạm, xác minh không có va quẹt và lập biên bản xử lý an toàn sân đỗ.',
    referenceDoc: 'Mục 4.2 - VJC-VJAA-M-125 & Quy tắc an toàn khoảng cách GSE',
    rubricMaxScore: 20,
    prohibitedActions: [
      'Tuyệt đối không cho phép tiếp tục đẩy khi phương tiện chưa rút khỏi vùng an toàn.',
      'Không bỏ qua sự cố mà không lập biên bản cảnh cáo lái xe vi phạm.'
    ],
    handSignals: [
      { step: 'Dừng khẩn cấp', description: 'Hai tay vung lên cao đan chéo chữ X' }
    ],
    explanationNotes: 'Bất kỳ phương tiện mặt đất (GSE) nào vi phạm cự ly 3m gần cánh hoặc đầu mút cánh trong khi tàu bay đang khởi động hay đẩy lùi đều là mối đe dọa va chạm nghiêm trọng.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'COCKPIT ALERT, COCKPIT ALERT! HOLD POSITION! HOLD POSITION!',
          vietnamese: 'CẢNH BÁO BUỒNG LÁI! GIỮ NGUYÊN VỊ TRÍ! GIỮ NGUYÊN VỊ TRÍ!',
          pronunciationNotes: 'Hô khẩu lệnh dứt khoát: "COCKPIT ALERT! HOLD POSITION!".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Holding position. Brakes applied. What is the hazard?',
          vietnamese: 'Đang giữ vị trí. Đã phanh lại. Có nguy hiểm gì?'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Baggage tractor entered the safety clearance zone behind right wing.',
          vietnamese: 'Xe kéo hàng đã đi vào vùng giới hạn an toàn phía sau cánh phải.',
          pronunciationNotes: '"Baggage tractor entered the safety clearance zone behind right wing".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Confirm no contact with aircraft structure?',
          vietnamese: 'Xác nhận xe có va chạm vào kết cấu tàu bay không?',
          prowords: ['CONFIRM']
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Negative contact. Wing walker stopped the vehicle 1.5 meters from wing tip.',
          vietnamese: 'Không có va quẹt. Nhân viên cảnh giới cánh đã chặn dừng xe cách đầu cánh 1,5 mét.',
          prowords: ['NEGATIVE'],
          pronunciationNotes: '"Negative contact. Stopped 1.5 meters from wing tip".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Good job by the wing walker. Order that vehicle to back out immediately.',
          vietnamese: 'Nhân viên cảnh giới làm rất tốt. Yêu cầu xe đó lùi ra ngoài ngay.'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Wilco. Baggage tractor is reversing out of the safety zone now.',
          vietnamese: 'Sẽ thực hiện. Xe kéo hàng đang lùi ra khỏi vùng an toàn.',
          prowords: ['WILCO'],
          pronunciationNotes: '"Baggage tractor is reversing out of the safety zone now".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Report when right wing clearance zone is completely free.',
          vietnamese: 'Báo lại khi vùng an toàn cánh phải hoàn toàn thông thoáng.'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Right wing clear. Vehicle escorted away. Conducting visual wing tip inspection.',
          vietnamese: 'Cánh phải đã thông thoáng. Xe đã bị áp giải ra ngoài. Đang kiểm tra trực quan đầu cánh.',
          pronunciationNotes: '"Right wing clear. Conducting visual wing tip inspection".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Standing by for inspection result.',
          vietnamese: 'Đang chờ kết quả kiểm tra.',
          prowords: ['STANDBY']
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Visual inspection complete. Wing tip and control surfaces are intact. No damage.',
          vietnamese: 'Kiểm tra trực quan xong. Đầu cánh và các cánh lái nguyên vẹn. Không có hư hại.',
          pronunciationNotes: '"Visual inspection complete. No damage".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Excellent. Have you taken driver details for safety report?',
          vietnamese: 'Rất tốt. Anh đã ghi nhận thông tin lái xe để lập báo cáo an toàn chưa?'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'Affirm. Driver badge number and vehicle ID recorded. Ramp Supervisor informed.',
          vietnamese: 'Đúng vậy. Đã ghi thẻ tài xế và biển số xe. Giám sát sân đỗ đã nắm thông tin.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Driver badge number and vehicle ID recorded".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Understood. Are we clear to continue pushback?',
          vietnamese: 'Đã hiểu. Chúng ta đã an toàn để tiếp tục đẩy lùi chưa?'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Affirm. All wings and rear paths are completely clear. Release parking brake.',
          vietnamese: 'Đúng vậy. Toàn bộ hai cánh và phía sau hoàn toàn thông thoáng. Xin xả phanh đỗ.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"All wings and rear paths are completely clear. Release parking brake".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Parking brake released. Continue pushback.',
          vietnamese: 'Phanh đỗ đã xả. Tiếp tục đẩy tàu bay.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Pushback complete. Please set parking brake.',
          vietnamese: 'Đẩy tàu bay hoàn tất. Vui lòng cài phanh đỗ.',
          pronunciationNotes: '"Pushback complete. Please set parking brake".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Parking brake set.',
          vietnamese: 'Phanh đỗ đã cài.'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch4-sc2-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Disconnecting equipment and headset. Hand signals on left side. All clear. Goodbye.',
          vietnamese: 'Đang ngắt trang thiết bị và tai nghe. Ra tín hiệu tay bên trái. An toàn. Tạm biệt.',
          pronunciationNotes: '"Hand signals on left side. All clear. Goodbye".'
        },
        cockpitTurn: {
          id: 'ch4-sc2-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Hand signals on left side copied. Thank you Ground, goodbye.',
          vietnamese: 'Đã nhận lệnh tín hiệu tay bên trái. Cảm ơn mặt đất, tạm biệt.'
        }
      }
    ]
  },

  // CHAPTER 5 - SCENARIO 9
  {
    id: 'ch5-sc1',
    chapter: 5,
    chapterTitle: 'Chương 5: Tín Hiệu Đánh Cờ Hiệu & Thuật Ngữ Đàm Thoại',
    title: 'Đánh tín hiệu đón A330 vào bến & Ra hiệu dừng khẩn cấp (Emergency Stop)',
    difficulty: 'Intermediate',
    aircraft: 'VN-A810 (Airbus A330 wide-body)',
    flight: 'VJ881',
    location: 'Sân bay Nội Bài (HAN) - Cầu hành khách Stand 18',
    equipment: 'Gậy tín hiệu phản quang (Wands) / Đèn LED ban đêm',
    conditions: 'Tàu bay đang lăn vào bến đỗ, cách vạch dừng 8m thì phát hiện chướng ngại vật',
    abnormality: 'Xe kéo hành lý còn đỗ trong vùng an toàn phía sau cánh phải',
    objective: 'Thực hiện chuỗi đánh tín hiệu đón tàu bay chuẩn ICAO và phân biệt dừng thông thường với dừng khẩn cấp.',
    referenceDoc: 'Mục 5.2 - VJC-VJAA-M-125 (Marshalling Signals)',
    rubricMaxScore: 20,
    handSignals: [
      { step: 'Nhận diện vị trí bến đỗ', description: 'Hai cánh tay duỗi thẳng giơ cao quá đầu, gậy tín hiệu chỉ thẳng đứng' },
      { step: 'Nhân viên cảnh giới cánh sẵn sàng', description: 'Tay phải giơ lên; tay trái cầm gậy chỉ xuống thân' },
      { step: 'Tiến thẳng', description: 'Gập khuỷu tay, di chuyển gậy lên xuống từ ngực lên đầu liên tục' },
      { step: 'Giảm tốc độ', description: 'Vung gậy nhẹ nhàng lên xuống từ ngang thắt lưng xuống đầu gối' },
      { step: 'Dừng khẩn cấp (EMERGENCY STOP)', description: 'Hai tay vung mạnh đột ngột lên trên, bắt chéo hai gậy thành hình chữ X dứt khoát' }
    ],
    explanationNotes: 'Khác biệt then chốt giữa dừng thường và dừng khẩn cấp: Dừng thường đưa hai tay từ từ lên cao cho đến khi gặp nhau. Dừng khẩn cấp vung đột ngột và BẮT CHÉO hình chữ X với tốc độ và lực tối đa.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Marshaller in position at Stand 18. Wing walkers ready.',
          vietnamese: 'Nhân viên đánh tín hiệu đã vào vị trí tại bến 18. Người cảnh giới cánh đã sẵn sàng.',
          pronunciationNotes: '"Marshaller in position at Stand 18. Wing walkers ready".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Cockpit visual on marshaller. Turning onto stand lead-in line.',
          vietnamese: 'Buồng lái đã thấy nhân viên đánh tín hiệu. Đang chuyển hướng vào đường dẫn bến đỗ.'
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Giving straight ahead signal. Distance to stop line 15 meters.',
          vietnamese: 'Đang ra tín hiệu tiến thẳng. Khoảng cách đến vạch dừng 15 mét.',
          pronunciationNotes: '"Giving straight ahead signal. Distance to stop line 15 meters".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Check straight ahead. Taxi speed 5 knots.',
          vietnamese: 'Kiểm tra tín hiệu tiến thẳng. Tốc độ lăn 5 hải lý/giờ.',
          prowords: ['CHECK']
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Wands patting motion - slow down. Distance 8 meters.',
          vietnamese: 'Động tác vỗ gậy nhẹ - giảm tốc độ. Cự ly còn 8 mét.',
          pronunciationNotes: '"Wands patting motion - slow down. Distance 8 meters".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Slowing down.',
          vietnamese: 'Đang giảm tốc độ.'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'EMERGENCY STOP! Wands crossed in X! Baggage tug in right wing safety zone!',
          vietnamese: 'DỪNG KHẨN CẤP! Bắt chéo gậy chữ X! Có xe kéo hành lý trong vùng an toàn cánh phải!',
          pronunciationNotes: 'Hô dứt khoát: "EMERGENCY STOP! Wands crossed in X!".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Emergency stop! Maximum braking applied. Aircraft stationary.',
          vietnamese: 'Dừng khẩn cấp! Đã đạp phanh tối đa. Tàu bay đã đứng yên.'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Hold position signal maintained. Ordering baggage tug to evacuate area.',
          vietnamese: 'Đang giữ tín hiệu đứng yên (hai tay hướng xuống 45 độ). Đang lệnh cho xe kéo rời khu vực.',
          pronunciationNotes: '"Hold position signal maintained".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Parking brake set. Cockpit standing by for all clear.',
          vietnamese: 'Đã cài phanh tay. Buồng lái chờ tín hiệu an toàn.',
          prowords: ['STANDBY']
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Baggage tug has cleared stand. Right wing path completely clear.',
          vietnamese: 'Xe kéo đã rời khỏi bến. Khoảng trống cánh phải hoàn toàn an toàn.',
          pronunciationNotes: '"Baggage tug has cleared stand. Right wing path completely clear".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Understood. Can we resume taxiing to final stop line?',
          vietnamese: 'Đã hiểu. Chúng tôi có thể tiếp tục lăn vào vạch dừng cuối không?'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'Affirm. Release brakes. Resuming straight ahead marshalling signal.',
          vietnamese: 'Đúng vậy. Xin nhả phanh. Tiếp tục phát tín hiệu tiến thẳng.',
          prowords: ['AFFIRM'],
          pronunciationNotes: '"Affirm. Release brakes. Resuming straight ahead marshalling signal".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Brakes released. Rolling slowly.',
          vietnamese: 'Phanh đã nhả. Đang lăn chậm từ từ.'
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Reaching stop mark: Slowly raising both wands until touch overhead. NORMAL STOP!',
          vietnamese: 'Đang đến vạch dừng: Từ từ nâng hai gậy lên đầu chạm nhau. DỪNG TIÊU CHUẨN!',
          pronunciationNotes: '"Slowly raising both wands until touch overhead. Normal stop!".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Aircraft on stop line. Setting parking brakes.',
          vietnamese: 'Tàu bay đã đúng vạch dừng. Đang cài phanh đỗ.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Signal: Right fist raised overhead. Chocks inserted in main gear.',
          vietnamese: 'Tín hiệu: Nắm tay phải giơ cao quá đầu (cài phanh). Đã chèn bánh càng chính.',
          pronunciationNotes: '"Right fist raised overhead. Chocks inserted".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Parking brake set confirmed. Engines shutting down.',
          vietnamese: 'Xác nhận phanh đỗ đã cài. Đang tắt động cơ.',
          prowords: ['CONFIRM']
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc1-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Chocks in place. Headset man connecting for arrival briefing. Welcome to Hanoi.',
          vietnamese: 'Chèn bánh đúng vị trí. Nhân viên headset đang cắm dây hội đàm. Chào mừng đến Hà Nội.',
          pronunciationNotes: '"Chocks in place. Headset man connecting".'
        },
        cockpitTurn: {
          id: 'ch5-sc1-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Roger. Excellent marshalling. Thank you Ground.',
          vietnamese: 'Đã nhận rõ. Đánh tín hiệu rất chuẩn xác. Cảm ơn mặt đất.',
          prowords: ['ROGER']
        }
      }
    ]
  },

  // CHAPTER 5 - SCENARIO 10
  {
    id: 'ch5-sc2',
    chapter: 5,
    chapterTitle: 'Chương 5: Tín Hiệu Đánh Cờ Hiệu & Thuật Ngữ Đàm Thoại',
    title: 'Xử lý hiểu nhầm đàm thoại bằng Prowords & Ngữ âm NATO (Noise & Miscommunication)',
    difficulty: 'Basic',
    aircraft: 'VN-A649 (Airbus A320)',
    flight: 'VJ100',
    location: 'Sân bay Tân Sơn Nhất (SGN) - Đường lăn',
    equipment: 'Bộ đàm VHF và Headset mặt đất',
    conditions: 'Tiếng ồn động cơ máy bay lân cận rất lớn, đường truyền chập chờn',
    abnormality: 'Tổ bay nghe không rõ hướng đẩy lui và trạng thái xả phanh',
    objective: 'Sử dụng thuần thục 5 thuật ngữ Proword trọng tâm (SAY AGAIN, CORRECTION, CONFIRM, ROGER, WORDS TWICE) và phát âm chữ cái NATO.',
    referenceDoc: 'Mục 5.2 - VJC-VJAA-M-125 (Prowords & NATO Phonetic Alphabet)',
    rubricMaxScore: 20,
    explanationNotes: 'Các prowords bắt buộc: SAY AGAIN (yêu cầu nhắc lại), CORRECTION (tự sửa lỗi vừa nói), CONFIRM (yêu cầu xác nhận thông tin), ROGER (đã nghe và hiểu), WORDS TWICE (yêu cầu đọc mỗi từ 2 lần do tiếng ồn). Đánh vần chữ cái NATO: NORTH = November Oscar Romeo Tango Hotel; VN-A649 = Victor November Alfa Six Four Niner.',
    dialoguePairs: [
      {
        pairIndex: 1,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p1-g',
          order: 1,
          speaker: 'Ground',
          text: 'Ground to Cockpit. Pushback facing North. Release parking brakes.',
          vietnamese: 'Mặt đất gọi buồng lái: Đẩy lui hướng Bắc. Xin xả phanh tay.',
          pronunciationNotes: '"Pushback facing North. Release parking brakes".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p1-c',
          order: 2,
          speaker: 'Cockpit',
          text: 'Say again the heading after pushback?',
          vietnamese: 'Xin nhắc lại hướng mũi tàu bay sau khi đẩy?',
          prowords: ['SAY AGAIN']
        }
      },
      {
        pairIndex: 2,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p2-g',
          order: 3,
          speaker: 'Ground',
          text: 'Correction. I say again: Pushback facing NOVEMBER - OSCAR - ROMEO - TANGO - HOTEL. Heading NORTH. Confirm.',
          vietnamese: 'Đính chính. Tôi xin nhắc lại: Đẩy lui hướng NOVEMBER - OSCAR - ROMEO - TANGO - HOTEL. Hướng BẮC. Xin xác nhận.',
          prowords: ['CORRECTION', 'SAY AGAIN', 'CONFIRM'],
          pronunciationNotes: 'Đánh vần NATO chuẩn từng chữ: "November - Oscar - Romeo - Tango - Hotel".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p2-c',
          order: 4,
          speaker: 'Cockpit',
          text: 'Affirm. Heading North confirmed. Brakes released.',
          vietnamese: 'Đúng vậy. Xác nhận hướng Bắc. Phanh đã nhả.',
          prowords: ['AFFIRM', 'CONFIRM']
        }
      },
      {
        pairIndex: 3,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p3-g',
          order: 5,
          speaker: 'Ground',
          text: 'Say again. High engine background noise. Unable to confirm brake status. Words twice.',
          vietnamese: 'Xin nhắc lại. Tiếng ồn động cơ lớn. Chưa thể xác nhận trạng thái phanh. Yêu cầu nhắc lại mỗi từ hai lần.',
          prowords: ['SAY AGAIN', 'WORDS TWICE'],
          pronunciationNotes: 'Rõ ràng: "Words twice".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p3-c',
          order: 6,
          speaker: 'Cockpit',
          text: 'Brakes released. Brakes released.',
          vietnamese: 'Phanh đã nhả. Phanh đã nhả.',
          pronunciationNotes: 'Lặp lại mỗi từ hai lần theo yêu cầu Words Twice.'
        }
      },
      {
        pairIndex: 4,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p4-g',
          order: 7,
          speaker: 'Ground',
          text: 'Roger. Brakes released confirmed. Commencing pushback.',
          vietnamese: 'Đã nhận rõ. Xác nhận phanh đã xả. Bắt đầu đẩy tàu bay.',
          prowords: ['ROGER', 'CONFIRM'],
          pronunciationNotes: '"Roger. Brakes released confirmed. Commencing pushback".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p4-c',
          order: 8,
          speaker: 'Cockpit',
          text: 'Ground, verify callsign on dispatch document?',
          vietnamese: 'Mặt đất nghe, kiểm tra lại số hiệu chuyến bay trên tài liệu điều phái?'
        }
      },
      {
        pairIndex: 5,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p5-g',
          order: 9,
          speaker: 'Ground',
          text: 'Aircraft registration: VICTOR - NOVEMBER - Alfa - SIX - FOUR - NINER.',
          vietnamese: 'Đăng bạ tàu bay: VICTOR - NOVEMBER - Alfa - SIX - FOUR - NINER (VN-A649).',
          pronunciationNotes: 'Đọc số 9 trong hàng không là "NINER", số 4 là "FOWER" hoặc "FOUR".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p5-c',
          order: 10,
          speaker: 'Cockpit',
          text: 'Read back correct: VN-A649. Clear to start Engine Number 2?',
          vietnamese: 'Đọc lại chính xác: VN-A649. Cho phép khởi động động cơ số 2 chưa?',
          prowords: ['READ BACK']
        }
      },
      {
        pairIndex: 6,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p6-g',
          order: 11,
          speaker: 'Ground',
          text: 'Clear to start Engine Number 2.',
          vietnamese: 'Cho phép khởi động động cơ số 2.',
          pronunciationNotes: '"Clear to start Engine Number 2".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p6-c',
          order: 12,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 2.',
          vietnamese: 'Bắt đầu nổ động cơ số 2.'
        }
      },
      {
        pairIndex: 7,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p7-g',
          order: 13,
          speaker: 'Ground',
          text: 'N1 rotation - Engine Number 2 verified.',
          vietnamese: 'Đã xác nhận vòng quay N1 động cơ số 2.',
          pronunciationNotes: '"N1 rotation - Engine Number 2 verified".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p7-c',
          order: 14,
          speaker: 'Cockpit',
          text: 'Check. Clear for Engine Number 1?',
          vietnamese: 'Đã kiểm tra. Cho phép động cơ số 1 chưa?',
          prowords: ['CHECK']
        }
      },
      {
        pairIndex: 8,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p8-g',
          order: 15,
          speaker: 'Ground',
          text: 'Clear to start Engine Number 1.',
          vietnamese: 'Cho phép khởi động động cơ số 1.',
          pronunciationNotes: '"Clear to start Engine Number 1".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p8-c',
          order: 16,
          speaker: 'Cockpit',
          text: 'Starting Engine Number 1.',
          vietnamese: 'Bắt đầu khởi động động cơ số 1.'
        }
      },
      {
        pairIndex: 9,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p9-g',
          order: 17,
          speaker: 'Ground',
          text: 'Pushback complete. Towbar disconnected. Set parking brakes.',
          vietnamese: 'Đẩy lui hoàn tất. Đã tháo cần kéo. Yêu cầu cài phanh tay.',
          pronunciationNotes: '"Pushback complete. Towbar disconnected. Set parking brakes".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p9-c',
          order: 18,
          speaker: 'Cockpit',
          text: 'Parking brakes set. Start complete. Disconnect headset.',
          vietnamese: 'Phanh tay đã cài. Khởi động hoàn tất. Cho phép ngắt tai nghe.'
        }
      },
      {
        pairIndex: 10,
        expectedInitiator: 'Ground',
        groundTurn: {
          id: 'ch5-sc2-p10-g',
          order: 19,
          speaker: 'Ground',
          text: 'Wilco. Disconnecting. Hand signals on right side. Have a good flight.',
          vietnamese: 'Sẽ thực hiện. Đang ngắt tai nghe. Ra tín hiệu tay bên phải. Chúc chuyến bay tốt đẹp.',
          prowords: ['WILCO'],
          pronunciationNotes: '"Wilco. Disconnecting. Hand signals on right side".'
        },
        cockpitTurn: {
          id: 'ch5-sc2-p10-c',
          order: 20,
          speaker: 'Cockpit',
          text: 'Roger. Hand signals on right side copied. Goodbye.',
          vietnamese: 'Đã nhận rõ. Tín hiệu tay bên phải đã ghi nhận. Tạm biệt.',
          prowords: ['ROGER']
        }
      }
    ]
  }
];
